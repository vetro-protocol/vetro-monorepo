import { type Address, isAddressEqual, type PublicClient } from "viem";
import { mainnet } from "viem/chains";

import { getVaultNetApys as getLagoonApys } from "./lagoon.ts";
import { gaugedStrategiesKey } from "./liquidity/incentives.ts";
import {
  type StakeDaoStrategy,
  strategyRewardsApr,
} from "./liquidity/stake-dao.ts";
import { getLiveOpportunities } from "./merkl.ts";
import { getVaultNetApys as getMorphoApys } from "./morpho.ts";
import { withTimeout } from "./utils/promises.ts";
import { getReceiptToken } from "./vesper.ts";

type LiveOpportunity = Awaited<ReturnType<typeof getLiveOpportunities>>[number];
type VaultApy = { address: Address; apy: number };
type GetVaultApys = (addresses: Address[]) => Promise<VaultApy[]>;
export type StrategyApy = Partial<Record<Address, number>>;

const findStakeDaoStrategy = ({
  receiptToken,
  strategies,
}: {
  receiptToken: Address;
  strategies: StakeDaoStrategy[];
}) =>
  strategies.find((strategy) =>
    isAddressEqual(strategy.lpToken.address, receiptToken),
  );

const findVaultApy = ({
  receiptToken,
  vaultApys,
}: {
  receiptToken: Address;
  vaultApys: VaultApy[];
}) =>
  vaultApys.find((vaultApy) => isAddressEqual(vaultApy.address, receiptToken))
    ?.apy;

export const merklApr = ({
  nowSeconds,
  opportunities,
  receiptToken,
}: {
  nowSeconds: number;
  opportunities: LiveOpportunity[];
  receiptToken: Address;
}) =>
  opportunities
    .filter((opportunity) =>
      isAddressEqual(opportunity.identifier, receiptToken),
    )
    .flatMap((opportunity) => opportunity.campaigns)
    .filter(
      (campaign) =>
        Number(campaign.startTimestamp) <= nowSeconds &&
        Number(campaign.endTimestamp) > nowSeconds,
    )
    .reduce((sum, campaign) => sum + campaign.apr, 0);

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
      const stakeDaoStrategy = findStakeDaoStrategy({
        receiptToken,
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
      return [
        [
          strategy,
          apy +
            merklApr({ nowSeconds, opportunities, receiptToken }) +
            (stakeDaoStrategy ? strategyRewardsApr(stakeDaoStrategy) : 0),
        ],
      ];
    }),
  ) as StrategyApy;

const getVaultApys = ({
  addresses,
  getApys,
  source,
}: {
  addresses: Address[];
  getApys: GetVaultApys;
  source: string;
}) =>
  addresses.length === 0
    ? Promise.resolve([])
    : withTimeout(getApys(addresses)).catch(function (error) {
        console.warn(`Failed to get the ${source} APYs: ${error.message}`);
        return [] as VaultApy[];
      });

/**
 * Get the APY of each strategy, as a percentage. It is the current native APY
 * that the protocol of the strategy reports, plus the APR of the incentives.
 */
export async function getStrategyApy({
  client,
  kv,
  strategies,
}: {
  client: PublicClient;
  kv: KVNamespace;
  strategies: Address[];
}) {
  if (strategies.length === 0) {
    return {} as StrategyApy;
  }
  const [stakeDaoStrategies, receiptTokenResults] = await Promise.all([
    kv
      .get<StakeDaoStrategy[]>(gaugedStrategiesKey, "json")
      .then((cached) => cached ?? []),
    Promise.allSettled(
      strategies.map((strategy) =>
        getReceiptToken(client, { address: strategy }),
      ),
    ),
  ]);
  const receiptTokens = strategies.flatMap(function (strategy, index) {
    const result = receiptTokenResults[index];
    if (result.status === "rejected") {
      console.warn(
        `Failed to get the APY of strategy ${strategy}: ${result.reason.message}`,
      );
      return [];
    }
    return [{ receiptToken: result.value, strategy }];
  });
  const vaultAddresses = receiptTokens
    .map(({ receiptToken }) => receiptToken)
    .filter(
      (receiptToken) =>
        !findStakeDaoStrategy({ receiptToken, strategies: stakeDaoStrategies }),
    );

  const [opportunities, morphoApys, lagoonApys] = await Promise.all([
    withTimeout(
      getLiveOpportunities({
        chainIds: [mainnet.id],
        identifiers: receiptTokens.map(({ receiptToken }) => receiptToken),
      }),
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

  return combineStrategyApy({
    nowSeconds: Math.floor(Date.now() / 1000),
    opportunities,
    receiptTokens,
    stakeDaoStrategies,
    vaultApys: [...morphoApys, ...lagoonApys],
  });
}
