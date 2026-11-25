import { type Address, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

import { getVaultNetApys as getLagoonApys } from "./lagoon.ts";
import {
  findStrategyByLpToken,
  type StakeDaoStrategy,
  strategyRewardsApr,
} from "./liquidity/stake-dao.ts";
import { getLiveOpportunities, validateCampaignWindow } from "./merkl.ts";
import { getVaultNetApys as getMorphoApys } from "./morpho.ts";
import { withTimeout } from "./utils/promises.ts";

type LiveOpportunity = Awaited<ReturnType<typeof getLiveOpportunities>>[number];
type VaultApy = { address: Address; apy: number };
type GetVaultApys = (addresses: Address[]) => Promise<VaultApy[]>;
type StrategyApy = Partial<Record<Address, number>>;

const strategyApyCacheTtl = 60 * 60;

const strategyApyCacheKey = (address: Address) =>
  `analytics:treasury:apy:${address.toLowerCase()}`;

const findVaultApy = ({
  receiptToken,
  vaultApys,
}: {
  receiptToken: Address;
  vaultApys: VaultApy[];
}) =>
  vaultApys.find((vaultApy) => isAddressEqual(vaultApy.address, receiptToken))
    ?.apy;

export const merklApr = function ({
  nowSeconds,
  opportunities,
  receiptToken,
}: {
  nowSeconds: number;
  opportunities: LiveOpportunity[];
  receiptToken: Address;
}) {
  const campaigns = opportunities
    .filter((opportunity) =>
      isAddressEqual(opportunity.identifier, receiptToken),
    )
    .flatMap((opportunity) => opportunity.campaigns);
  campaigns.forEach(validateCampaignWindow);
  return campaigns
    .filter(
      (campaign) =>
        Number(campaign.startTimestamp) <= nowSeconds &&
        Number(campaign.endTimestamp) > nowSeconds,
    )
    .reduce((sum, campaign) => sum + campaign.apr, 0);
};

export const combineStrategyApy = ({
  nowSeconds,
  opportunities,
  receiptTokens,
  stakeDaoStrategies,
  vaultApys,
}: {
  nowSeconds: number;
  opportunities: LiveOpportunity[];
  receiptTokens: { receiptToken: Address; strategy: Address }[];
  stakeDaoStrategies: StakeDaoStrategy[];
  vaultApys: VaultApy[];
}) =>
  Object.fromEntries(
    receiptTokens.flatMap(function ({ receiptToken, strategy }) {
      const stakeDaoStrategy = findStrategyByLpToken({
        lpToken: receiptToken,
        strategies: stakeDaoStrategies,
      });
      const apy = stakeDaoStrategy
        ? stakeDaoStrategy.tradingApy
        : findVaultApy({ receiptToken, vaultApys });
      if (apy === undefined || !Number.isFinite(apy)) {
        console.warn(
          `Failed to get the APY of strategy ${strategy}: the native APY is ${apy}`,
        );
        return [];
      }
      try {
        return [
          [
            strategy,
            apy +
              merklApr({ nowSeconds, opportunities, receiptToken }) +
              (stakeDaoStrategy ? strategyRewardsApr(stakeDaoStrategy) : 0),
          ],
        ];
      } catch (error) {
        console.warn(
          `Failed to combine the APY of strategy ${strategy}: ${error.message}`,
        );
        // Keep this strategy eligible for its cached APY without failing siblings.
        return [[strategy, Number.NaN]];
      }
    }),
  ) as StrategyApy;

async function getVaultApys({
  addresses,
  getApys,
  source,
}: {
  addresses: Address[];
  getApys: GetVaultApys;
  source: string;
}) {
  if (addresses.length === 0) {
    return { apys: [], failed: false };
  }
  try {
    return { apys: await withTimeout(getApys(addresses)), failed: false };
  } catch (error) {
    console.warn(`Failed to get the ${source} APYs: ${error.message}`);
    return { apys: [], failed: true };
  }
}

async function getMerklOpportunities(receiptTokens: Address[]) {
  if (receiptTokens.length === 0) {
    return { failed: false, opportunities: [] as LiveOpportunity[] };
  }
  try {
    return {
      failed: false,
      opportunities: await withTimeout(
        getLiveOpportunities({
          chainIds: [mainnet.id],
          identifiers: receiptTokens,
        }),
      ),
    };
  } catch (error) {
    console.warn(`Failed to get the Merkl APYs: ${error.message}`);
    return { failed: true, opportunities: [] as LiveOpportunity[] };
  }
}

async function getCachedStrategyApys({
  kv,
  strategies,
}: {
  kv: KVNamespace;
  strategies: { address: Address }[];
}) {
  const cachedApys = await Promise.all(
    strategies.map(async function ({ address }) {
      try {
        const apy = await kv.get<number>(strategyApyCacheKey(address), "json");
        return typeof apy === "number" && Number.isFinite(apy)
          ? ([address, apy] as const)
          : null;
      } catch (error) {
        console.warn(
          `Failed to read the cached APY of strategy ${address}: ${error.message}`,
        );
        return null;
      }
    }),
  );
  return Object.fromEntries(
    cachedApys.filter((entry) => entry !== null),
  ) as StrategyApy;
}

async function cacheStrategyApy({
  address,
  apy,
  kv,
}: {
  address: Address;
  apy: number;
  kv: KVNamespace;
}) {
  try {
    await kv.put(strategyApyCacheKey(address), JSON.stringify(apy), {
      expirationTtl: strategyApyCacheTtl,
    });
  } catch (error) {
    console.warn(
      `Failed to cache the APY of strategy ${address}: ${error.message}`,
    );
  }
}

/**
 * Get each strategy's APY as a percentage, using its last good value when
 * source data is unavailable.
 */
export async function getStrategyApy({
  kv,
  stakeDaoStrategies,
  strategies,
}: {
  kv: KVNamespace;
  stakeDaoStrategies: StakeDaoStrategy[] | null;
  strategies: { address: Address; receiptToken: Address | undefined }[];
}) {
  if (strategies.length === 0) {
    return {};
  }
  const availableStakeDaoStrategies = stakeDaoStrategies ?? [];
  const receiptTokens = strategies.flatMap(({ address, receiptToken }) =>
    receiptToken ? [{ receiptToken, strategy: address }] : [],
  );
  const vaultAddresses = receiptTokens
    .map(({ receiptToken }) => receiptToken)
    .filter(
      (receiptToken) =>
        !findStrategyByLpToken({
          lpToken: receiptToken,
          strategies: availableStakeDaoStrategies,
        }),
    );

  const [cachedApys, merklResult, morphoResult, lagoonResult] =
    await Promise.all([
      getCachedStrategyApys({ kv, strategies }),
      getMerklOpportunities(
        receiptTokens.map(({ receiptToken }) => receiptToken),
      ),
      getVaultApys({
        addresses: vaultAddresses,
        getApys: getMorphoApys,
        source: "Morpho",
      }),
      getVaultApys({
        addresses: vaultAddresses,
        getApys: getLagoonApys,
        source: "Lagoon",
      }),
    ]);

  const nativeApys = [...morphoResult.apys, ...lagoonResult.apys];
  let merklFailed = merklResult.failed;
  let freshApys: StrategyApy = {};
  try {
    freshApys = combineStrategyApy({
      nowSeconds: Math.floor(Date.now() / 1000),
      opportunities: merklResult.opportunities,
      receiptTokens,
      stakeDaoStrategies: availableStakeDaoStrategies,
      vaultApys: nativeApys,
    });
  } catch (error) {
    console.warn(`Failed to combine strategy APYs: ${error.message}`);
    merklFailed = true;
  }
  const nativeSourceUnavailable =
    morphoResult.failed || lagoonResult.failed || stakeDaoStrategies === null;
  const result: StrategyApy = {};

  await Promise.all(
    strategies.map(async function ({ address, receiptToken }) {
      const freshApy = freshApys[address];
      if (!merklFailed && freshApy !== undefined) {
        if (Number.isFinite(freshApy)) {
          result[address] = freshApy;
          await cacheStrategyApy({ address, apy: freshApy, kv });
          return;
        }
        console.warn(
          `Failed to get the APY of strategy ${address}: the combined APY is ${freshApy}`,
        );
      }
      if (
        freshApy !== undefined ||
        merklFailed ||
        nativeSourceUnavailable ||
        receiptToken === undefined
      ) {
        const cachedApy = cachedApys[address];
        if (cachedApy !== undefined) {
          result[address] = cachedApy;
        }
      }
    }),
  );
  return result;
}
