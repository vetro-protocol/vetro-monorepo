import { createMainnetClient } from "@vetro-protocol/core";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import type { Context } from "hono";
import { type Address, isAddressEqual } from "viem";
import { decimals } from "viem-erc20/actions";
import { asset, totalAssets } from "viem-erc4626/actions";

import { readWarmedTask } from "./warm-cache.ts";
import { treasuryTask } from "./warm-tasks.ts";

type CompositionItem = {
  name?: string;
  token: Address;
  type: "reserve" | "strategy";
  // In pegged token base units
  value: bigint;
};

const shareScale = 10n ** 18n;

/**
 * Distribute the vault's total assets pro rata across the items by value. The
 * amounts always add up to `total`: the rounding remainder goes to the item
 * with the largest value. Items that end up with a zero amount are omitted, and
 * the rest are sorted by amount, descending.
 */
export function allocateComposition({
  items,
  total,
}: {
  items: CompositionItem[];
  total: bigint;
}) {
  // Dividing by the items' own sum (instead of the Treasury reserve) keeps the
  // shares adding up to 1 even if the two ever diverge.
  const valuesSum = items.reduce((acc, { value }) => acc + value, 0n);
  if (valuesSum === 0n) {
    return { items: [], total };
  }
  const allocated = items.map(({ value, ...item }) => ({
    ...item,
    amount: (value * total) / valuesSum,
    share: Number((value * shareScale) / valuesSum) / Number(shareScale),
    value,
  }));
  const remainder =
    total - allocated.reduce((acc, { amount }) => acc + amount, 0n);
  const largest = allocated.reduce((max, item) =>
    item.value > max.value ? item : max,
  );
  largest.amount += remainder;

  return {
    items: allocated
      .filter(({ amount }) => amount > 0n)
      .sort((a, b) =>
        a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1,
      )
      .map(({ amount, name, share, token, type }) => ({
        amount,
        name,
        share,
        token,
        type,
      })),
    total,
  };
}

async function findGatewayForPeggedToken({
  client,
  peggedTokenAddress,
}: {
  client: ReturnType<typeof createMainnetClient>;
  peggedTokenAddress: Address;
}) {
  const peggedTokens = await Promise.all(
    gatewayAddresses.map((address) => getPeggedToken(client, { address })),
  );
  const gatewayAddress = gatewayAddresses.find((_, index) =>
    isAddressEqual(peggedTokens[index], peggedTokenAddress),
  );
  if (!gatewayAddress) {
    throw new Error(`No gateway found for pegged token ${peggedTokenAddress}`);
  }
  return gatewayAddress;
}

/**
 * Get the composition of a staking vault's deposits. The vault holds only the
 * pegged token, which is a claim on the pooled Treasury, so its composition is
 * the Treasury's pro rata: one item per active strategy plus one idle reserve
 * per whitelisted token. Excludes the strategic reserves and the surplus, as
 * they are the pegged token itself.
 *
 * The Treasury data is the one `GET /analytics/treasury` serves, warmed by the
 * cron. Its prices can be up to the warmed value's TTL old, so their freshness
 * is checked here, at request time, against the `updatedAt` stored with each
 * one. Analytics doesn't check it, so it keeps working with a stale price.
 */
export async function getVaultComposition({
  c,
  stakingVaultAddress,
}: {
  c: Context<{ Bindings: Env }>;
  stakingVaultAddress: Address;
}) {
  const client = createMainnetClient(c.env.CUSTOM_RPC_URL_MAINNET);
  const [peggedTokenAddress, total] = await Promise.all([
    asset(client, { address: stakingVaultAddress }),
    totalAssets(client, { address: stakingVaultAddress }),
  ]);
  const [gatewayAddress, peggedDecimals] = await Promise.all([
    findGatewayForPeggedToken({ client, peggedTokenAddress }),
    decimals(client, { address: peggedTokenAddress }),
  ]);
  const treasuryTokens = await readWarmedTask({
    c,
    item: gatewayAddress,
    task: treasuryTask,
  });

  // Same clock as the Treasury's staleness check, in seconds
  const now = BigInt(Math.floor(Date.now() / 1000));
  const items = treasuryTokens.flatMap(function (treasuryToken) {
    const price = BigInt(treasuryToken.latestPrice);
    if (price <= 0n) {
      throw new Error(`Invalid oracle price for ${treasuryToken.tokenAddress}`);
    }
    if (
      BigInt(treasuryToken.updatedAt) + BigInt(treasuryToken.stalePeriod) <
      now
    ) {
      throw new Error(`Stale oracle price for ${treasuryToken.tokenAddress}`);
    }

    // Values the amount like Treasury.reserve() does: the oracle price is
    // capped at par, and the result is in pegged token units. Not like
    // Treasury.getPrice, which reverts when a token is off par beyond the
    // price tolerance.
    const unitPrice = 10n ** BigInt(treasuryToken.priceDecimals);
    const cappedPrice = price < unitPrice ? price : unitPrice;
    const toPeggedValue = (amount: bigint) =>
      (amount * cappedPrice * 10n ** BigInt(peggedDecimals)) /
      (unitPrice * 10n ** BigInt(treasuryToken.tokenDecimals));

    const totalDebt = BigInt(treasuryToken.totalDebt);
    const withdrawable = BigInt(treasuryToken.withdrawable);
    return [
      ...treasuryToken.activeStrategies.map((strategy) => ({
        name: strategy.name,
        token: treasuryToken.tokenAddress,
        type: "strategy" as const,
        value: toPeggedValue(BigInt(strategy.totalDebt)),
      })),
      {
        token: treasuryToken.tokenAddress,
        type: "reserve" as const,
        value: toPeggedValue(
          withdrawable > totalDebt ? withdrawable - totalDebt : 0n,
        ),
      },
    ] satisfies CompositionItem[];
  });

  return allocateComposition({ items, total });
}
