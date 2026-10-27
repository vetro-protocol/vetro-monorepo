import {
  type Address,
  type Client,
  erc4626Abi,
  isAddressEqual,
  type PublicClient,
} from "viem";
import { getBlock, readContract } from "viem/actions";
import { mainnet } from "viem/chains";
import { decimals } from "viem-erc20/actions";

import { gaugedStrategiesKey } from "./liquidity/incentives.ts";
import {
  type StakeDaoStrategy,
  strategyRewardsApr,
} from "./liquidity/stake-dao.ts";
import { getLiveOpportunities } from "./merkl.ts";
import { fulfilledValues, withTimeout } from "./utils/promises.ts";
import { SECONDS_PER_YEAR } from "./utils/time.ts";
import { getReceiptToken } from "./vesper.ts";

type LiveOpportunity = Awaited<ReturnType<typeof getLiveOpportunities>>[number];
export type StrategyApy = Partial<Record<Address, number>>;

const blocksPerWeek = 50_400n;

const curvePoolAbi = [
  {
    inputs: [],
    name: "get_virtual_price",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const isCurveLpToken = ({
  receiptToken,
  stakeDaoStrategies,
}: {
  receiptToken: Address;
  stakeDaoStrategies: StakeDaoStrategy[];
}) =>
  stakeDaoStrategies.some((strategy) =>
    isAddressEqual(strategy.lpToken.address, receiptToken),
  );

// A strategy holds either an ERC-4626 vault share (Morpho, Lagoon) or a Curve
// LP token (StakeDAO), and each has its own price per share read.
async function getPricePerShareReader({
  client,
  receiptToken,
  stakeDaoStrategies,
}: {
  client: Client;
  receiptToken: Address;
  stakeDaoStrategies: StakeDaoStrategy[];
}) {
  if (isCurveLpToken({ receiptToken, stakeDaoStrategies })) {
    return (blockNumber: bigint) =>
      readContract(client, {
        abi: curvePoolAbi,
        address: receiptToken,
        blockNumber,
        functionName: "get_virtual_price",
      });
  }
  const shareDecimals = await decimals(client, { address: receiptToken });
  return (blockNumber: bigint) =>
    readContract(client, {
      abi: erc4626Abi,
      address: receiptToken,
      args: [10n ** BigInt(shareDecimals)],
      blockNumber,
      functionName: "convertToAssets",
    });
}

export const annualizeGrowth = ({
  elapsedSeconds,
  pastPrice,
  price,
}: {
  elapsedSeconds: number;
  pastPrice: bigint;
  price: bigint;
}) =>
  ((Number(price) / Number(pastPrice)) **
    (Number(SECONDS_PER_YEAR) / elapsedSeconds) -
    1) *
  100;

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

export const stakeDaoApr = function ({
  receiptToken,
  strategies,
}: {
  receiptToken: Address;
  strategies: StakeDaoStrategy[];
}) {
  const strategy = strategies.find((candidate) =>
    isAddressEqual(candidate.lpToken.address, receiptToken),
  );
  return strategy ? strategyRewardsApr(strategy) : 0;
};

/**
 * Get the APY of each strategy, as a percentage. It is the native APY plus
 * the APR of the incentives.
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
  const receiptTokenPromises = strategies.map((strategy) =>
    getReceiptToken(client, { address: strategy }),
  );
  const [stakeDaoStrategies, [latestBlock, pastBlock], receiptTokenResults] =
    await Promise.all([
      kv.get<StakeDaoStrategy[]>(gaugedStrategiesKey, "json"),
      getBlock(client).then((block) =>
        getBlock(client, { blockNumber: block.number - blocksPerWeek }).then(
          (past) => [block, past] as const,
        ),
      ),
      Promise.allSettled(receiptTokenPromises),
    ]);
  if (!stakeDaoStrategies) {
    throw new Error("The StakeDAO strategies are not cached");
  }
  const nowSeconds = Number(latestBlock.timestamp);

  const [opportunities, nativeApys] = await Promise.all([
    withTimeout(
      getLiveOpportunities({
        chainIds: [mainnet.id],
        identifiers: fulfilledValues(receiptTokenResults),
      }),
    ),
    Promise.all(
      strategies.map(async function (strategy, index) {
        try {
          const receiptToken = await receiptTokenPromises[index];
          const readPrice = await getPricePerShareReader({
            client,
            receiptToken,
            stakeDaoStrategies,
          });
          const [price, pastPrice] = await Promise.all([
            readPrice(latestBlock.number),
            readPrice(pastBlock.number),
          ]);
          const nativeApy = annualizeGrowth({
            elapsedSeconds: nowSeconds - Number(pastBlock.timestamp),
            pastPrice,
            price,
          });
          if (!Number.isFinite(nativeApy)) {
            throw new Error(`The native APY is not finite: ${nativeApy}`);
          }
          return { nativeApy, receiptToken, strategy };
        } catch (error) {
          console.warn(
            `Failed to get the APY of strategy ${strategy}: ${error.message}`,
          );
          return null;
        }
      }),
    ),
  ]);

  return Object.fromEntries(
    nativeApys
      .filter((entry) => entry !== null)
      .map(({ nativeApy, receiptToken, strategy }) => [
        strategy,
        nativeApy +
          merklApr({ nowSeconds, opportunities, receiptToken }) +
          stakeDaoApr({ receiptToken, strategies: stakeDaoStrategies }),
      ]),
  ) as StrategyApy;
}
