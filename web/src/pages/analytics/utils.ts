import type { Token } from "types";
import { formatNumber } from "utils/format";
import { formatUnits } from "viem";

import type { TreasuryToken } from "./types";

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

const assignColor = (index: number) =>
  colorPalette[index % colorPalette.length] ?? "bg-gray-400";

const priceDecimals = 8;

const findToken = (tokenAddress: string, whitelistedTokens: Token[]) =>
  whitelistedTokens.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase(),
  );

// Transforms /analytics/treasury response into TVL allocation items.
// amount: USD value = (withdrawable / 10^decimals) × (latestPrice / 10^8)
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
    { latestPrice, tokenAddress, withdrawable },
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
// amount: USD value = (totalDebt / 10^decimals) × (latestPrice / 10^8)
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
