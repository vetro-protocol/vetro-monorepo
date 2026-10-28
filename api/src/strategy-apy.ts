import { type Address, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

import { getVaultNetApys as getLagoonApys } from "./lagoon.ts";
import {
  findStrategyByLpToken,
  type StakeDaoStrategy,
  strategyRewardsApr,
} from "./liquidity/stake-dao.ts";
import { getLiveOpportunities } from "./merkl.ts";
import { getVaultNetApys as getMorphoApys } from "./morpho.ts";
import { withTimeout } from "./utils/promises.ts";

type LiveOpportunity = Awaited<ReturnType<typeof getLiveOpportunities>>[number];
type VaultApy = { address: Address; apy: number };
type GetVaultApys = (addresses: Address[]) => Promise<VaultApy[]>;
export type StrategyApy = Partial<Record<Address, number>>;

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
  stakeDaoStrategies,
  strategies,
}: {
  stakeDaoStrategies: StakeDaoStrategy[];
  strategies: { address: Address; receiptToken: Address | undefined }[];
}) {
  if (strategies.length === 0) {
    return {} as StrategyApy;
  }
  const receiptTokens = strategies.flatMap(({ address, receiptToken }) =>
    receiptToken ? [{ receiptToken, strategy: address }] : [],
  );
  const vaultAddresses = receiptTokens
    .map(({ receiptToken }) => receiptToken)
    .filter(
      (receiptToken) =>
        !findStrategyByLpToken({
          lpToken: receiptToken,
          strategies: stakeDaoStrategies,
        }),
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
