import { createMainnetClient } from "@vetro-protocol/core";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getPeggedToken, getTreasury } from "@vetro-protocol/gateway/actions";
import {
  getPrice,
  getTokenConfig,
  getWhitelistedTokens,
  getWithdrawable,
} from "@vetro-protocol/treasury/actions";
import { type Address, isAddressEqual } from "viem";
import { decimals } from "viem-erc20/actions";
import { asset, totalAssets } from "viem-erc4626/actions";

import {
  getStrategies,
  getStrategyConfig,
  getTotalDebt,
  getVaultName,
} from "./vesper.ts";

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
 */
export async function getVaultComposition({
  rpcUrl,
  stakingVaultAddress,
}: {
  rpcUrl: string | undefined;
  stakingVaultAddress: Address;
}) {
  const client = createMainnetClient(rpcUrl);
  const [peggedTokenAddress, total] = await Promise.all([
    asset(client, { address: stakingVaultAddress }),
    totalAssets(client, { address: stakingVaultAddress }),
  ]);
  const gatewayAddress = await findGatewayForPeggedToken({
    client,
    peggedTokenAddress,
  });
  const [peggedDecimals, treasuryAddress] = await Promise.all([
    decimals(client, { address: peggedTokenAddress }),
    getTreasury(client, { address: gatewayAddress }),
  ]);
  const whitelistedTokens = await getWhitelistedTokens(client, {
    address: treasuryAddress,
  });

  const items = await Promise.all(
    whitelistedTokens.map(async function (token) {
      const [
        [yieldVaultAddress, , , , , tokenDecimals],
        withdrawable,
        // Reverts if the oracle price is stale
        [latestPrice, unitPrice],
      ] = await Promise.all([
        getTokenConfig(client, { address: treasuryAddress, token }),
        getWithdrawable(client, { address: treasuryAddress, token }),
        getPrice(client, { address: treasuryAddress, token }),
      ]);
      const [strategies, totalDebt] = await Promise.all([
        getStrategies(client, { address: yieldVaultAddress }),
        getTotalDebt(client, { address: yieldVaultAddress }),
      ]);
      const strategyData = await Promise.all(
        strategies.map((address) =>
          Promise.all([
            getStrategyConfig(client, {
              address: yieldVaultAddress,
              strategy: address,
            }),
            getVaultName(client, { address }),
          ]),
        ),
      );

      // Values the amount like Treasury.reserve() does: the oracle price is
      // capped at par, and the result is in pegged token units.
      const cappedPrice = latestPrice < unitPrice ? latestPrice : unitPrice;
      const toPeggedValue = (amount: bigint) =>
        (amount * cappedPrice * 10n ** BigInt(peggedDecimals)) /
        (unitPrice * 10n ** BigInt(tokenDecimals));

      return [
        ...strategyData
          .filter(([{ active }]) => active)
          .map(([{ totalDebt: strategyDebt }, name]) => ({
            name: name.replaceAll("_", " "),
            token,
            type: "strategy" as const,
            value: toPeggedValue(strategyDebt),
          })),
        {
          token,
          type: "reserve" as const,
          value: toPeggedValue(
            withdrawable > totalDebt ? withdrawable - totalDebt : 0n,
          ),
        },
      ] satisfies CompositionItem[];
    }),
  );

  return allocateComposition({ items: items.flat(), total });
}
