import type { Token } from "types";
import { formatNumber } from "utils/format";
import { formatUnits } from "viem";

import type { AllocationItem, TreasuryToken } from "./types";

const colorPalette = [
  "bg-blue-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-purple-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-pink-400",
];

export const assignColor = (index: number) =>
  colorPalette[index % colorPalette.length] ?? "bg-gray-400";

const findToken = (tokenAddress: string, whitelistedTokens: Token[]) =>
  whitelistedTokens.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase(),
  );

// Transforms /analytics/treasury response into TVL allocation items.
// amount: USD value = (withdrawable / 10^decimals) × (latestPrice / 10^priceDecimals)
// withdrawable includes idle funds + deployed strategies (vs totalDebt = strategies only).
// tokenDecimals sourced from whitelistedTokens; falls back to 18 for unknown tokens.
export const toTvlItems = ({
  treasuryTokens = [],
  whitelistedTokens = [],
}: {
  treasuryTokens?: TreasuryToken[];
  whitelistedTokens?: Token[];
}) =>
  treasuryTokens.map(function (
    { latestPrice, priceDecimals, tokenAddress, withdrawable },
    index,
  ) {
    const token = findToken(tokenAddress, whitelistedTokens);
    const decimals = token?.decimals ?? 18;
    const symbol = token?.symbol ?? tokenAddress.slice(0, 6);
    return {
      amount:
        Number(formatUnits(BigInt(withdrawable), decimals)) *
        Number(formatUnits(BigInt(latestPrice), priceDecimals)),
      color: assignColor(index),
      label: symbol,
      logoURI: token?.logoURI,
      tooltip: `${formatNumber(formatUnits(BigInt(withdrawable), decimals))} ${symbol}`,
    };
  });

// Transforms /analytics/treasury response into yield allocation items,
// one item per active strategy across all tokens.
// amount: USD value = (totalDebt / 10^decimals) × (latestPrice / 10^priceDecimals)
export const toYieldItems = function ({
  treasuryTokens = [],
  whitelistedTokens = [],
}: {
  treasuryTokens?: TreasuryToken[];
  whitelistedTokens?: Token[];
}) {
  const items: { amount: number; color: string; label: string }[] = [];

  for (const {
    activeStrategies,
    latestPrice,
    priceDecimals,
    tokenAddress,
  } of treasuryTokens) {
    const token = findToken(tokenAddress, whitelistedTokens);
    const decimals = token?.decimals ?? 18;
    const price = Number(formatUnits(BigInt(latestPrice), priceDecimals));

    for (const { name, totalDebt } of activeStrategies) {
      const amount = Number(formatUnits(BigInt(totalDebt), decimals)) * price;
      if (amount > 0) {
        items.push({ amount, color: assignColor(items.length), label: name });
      }
    }
  }

  return items;
};

// Converts collateralization data into percentage-based allocation items.
// Rounds to 2 decimal places and adjusts the largest item so they sum to exactly 100.
export const toCollateralizationItems = function (
  data:
    | {
        strategicReserves: number;
        surplus: number;
        total: number;
        treasuryTotal: number;
      }
    | undefined,
  labels: {
    liquidReserves: string;
    strategicReserves: string;
    surplus: string;
  },
): Omit<AllocationItem, "color">[] | undefined {
  if (!data || data.total <= 0) {
    return undefined;
  }
  const round = (n: number) => Number(n.toFixed(2));
  const items = [
    {
      amount: round((data.strategicReserves / data.total) * 100),
      label: labels.strategicReserves,
    },
    {
      amount: round((data.treasuryTotal / data.total) * 100),
      label: labels.liquidReserves,
    },
    {
      amount: round((data.surplus / data.total) * 100),
      label: labels.surplus,
    },
  ].sort((a, b) => b.amount - a.amount);

  // Adjust the largest so percentages sum to exactly 100
  const sum = items.reduce((acc, item) => acc + item.amount, 0);
  items[0].amount = round(items[0].amount + (100 - sum));

  return items;
};

// Returns the reserve buffer amount in USD (idle funds not deployed to any strategy).
// Returns 0 when there is no buffer. Color is intentionally omitted — callers assign it.
export const toReserveBufferAmount = function ({
  treasuryTokens = [],
  whitelistedTokens = [],
}: {
  treasuryTokens?: TreasuryToken[];
  whitelistedTokens?: Token[];
}) {
  let amount = 0;

  for (const {
    latestPrice,
    priceDecimals,
    tokenAddress,
    totalDebt,
    withdrawable,
  } of treasuryTokens) {
    const token = findToken(tokenAddress, whitelistedTokens);
    const decimals = token?.decimals ?? 18;
    const price = Number(formatUnits(BigInt(latestPrice), priceDecimals));

    amount +=
      (Number(formatUnits(BigInt(withdrawable), decimals)) -
        Number(formatUnits(BigInt(totalDebt), decimals))) *
      price;
  }

  return Math.max(0, amount);
};
