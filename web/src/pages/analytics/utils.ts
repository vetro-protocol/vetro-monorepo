import type { Token } from "types";
import { tokenAmountToUsd } from "utils/currency";
import { formatNumber } from "utils/format";
import { formatUnits, isAddressEqual, type Address } from "viem";

import type { AllocationItem, TreasuryToken } from "./types";

type Prices = Record<string, string>;

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

const findToken = (tokenAddress: Address, whitelistedTokens: Token[]) =>
  whitelistedTokens.find((t) => isAddressEqual(t.address, tokenAddress));

// Transforms /analytics/treasury response into TVL allocation items.
// withdrawable includes idle funds + deployed strategies (vs totalDebt = strategies only).
export const toTvlItems = ({
  prices,
  treasuryTokens,
  whitelistedTokens,
}: {
  prices: Prices;
  treasuryTokens: TreasuryToken[];
  whitelistedTokens: Token[];
}) =>
  treasuryTokens.flatMap(function ({ tokenAddress, withdrawable }, index) {
    const token = findToken(tokenAddress, whitelistedTokens);
    if (!token) {
      return [];
    }
    const { decimals, symbol } = token;

    return [
      {
        amount: tokenAmountToUsd({
          amount: BigInt(withdrawable),
          prices,
          token,
        }),
        color: assignColor(index),
        label: symbol,
        logoURI: token.logoURI,
        tooltip: `${formatNumber(formatUnits(BigInt(withdrawable), decimals))} ${symbol}`,
      },
    ];
  });

// Transforms /analytics/treasury response into yield allocation items,
// one item per active strategy across all tokens.
export const toYieldItems = function ({
  prices,
  treasuryTokens,
  whitelistedTokens,
}: {
  prices: Prices;
  treasuryTokens: TreasuryToken[];
  whitelistedTokens: Token[];
}) {
  const items: { amount: number; color: string; label: string }[] = [];

  for (const { activeStrategies, tokenAddress } of treasuryTokens) {
    const token = findToken(tokenAddress, whitelistedTokens);
    if (!token) {
      continue;
    }

    for (const { name, totalDebt } of activeStrategies) {
      const amount = tokenAmountToUsd({
        amount: BigInt(totalDebt),
        prices,
        token,
      });
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
        strategicReserves: string;
        surplus: string;
        total: string;
        treasuryTotal: string;
      }
    | undefined,
  labels: {
    liquidReserves: string;
    strategicReserves: string;
    surplus: string;
  },
): Omit<AllocationItem, "color">[] | undefined {
  if (!data || Number(data.total) <= 0) {
    return undefined;
  }
  const total = Number(data.total);
  const round = (n: number) => Number(n.toFixed(2));
  const items = [
    {
      amount: round((Number(data.strategicReserves) / total) * 100),
      label: labels.strategicReserves,
    },
    {
      amount: round((Number(data.treasuryTotal) / total) * 100),
      label: labels.liquidReserves,
    },
    {
      amount: round((Number(data.surplus) / total) * 100),
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
  prices,
  treasuryTokens,
  whitelistedTokens,
}: {
  prices: Prices;
  treasuryTokens: TreasuryToken[];
  whitelistedTokens: Token[];
}) {
  let amount = 0;

  for (const { tokenAddress, totalDebt, withdrawable } of treasuryTokens) {
    const token = findToken(tokenAddress, whitelistedTokens);
    if (!token) continue;

    amount += tokenAmountToUsd({
      amount: BigInt(withdrawable) - BigInt(totalDebt),
      prices,
      token,
    });
  }

  return Math.max(0, amount);
};
