import type { Token } from "types";
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

// Extracts the protocol name from a strategy name.
// e.g. "Morpho SkyMoney USDT Savings" → "Morpho"
const extractProtocol = (strategyName: string) =>
  strategyName.split(" ")[0] ?? strategyName;

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
  treasuryTokens,
  whitelistedTokens,
}: {
  treasuryTokens: TreasuryToken[];
  whitelistedTokens: Token[];
}) =>
  treasuryTokens.map(function (
    { latestPrice, tokenAddress, withdrawable },
    index,
  ) {
    const token = findToken(tokenAddress, whitelistedTokens);
    return {
      amount:
        Number(formatUnits(BigInt(withdrawable), token?.decimals ?? 18)) *
        Number(formatUnits(BigInt(latestPrice), priceDecimals)),
      color: assignColor(index),
      label: token?.symbol ?? tokenAddress.slice(0, 6),
    };
  });

// Transforms /analytics/treasury response into yield allocation items,
// grouping active strategies by protocol across all tokens.
// amount: sum of USD value per strategy within each protocol.
export const toYieldItems = function ({
  treasuryTokens,
  whitelistedTokens,
}: {
  treasuryTokens: TreasuryToken[];
  whitelistedTokens: Token[];
}) {
  const protocolMap = new Map<string, number>();

  for (const {
    activeStrategies,
    latestPrice,
    tokenAddress,
  } of treasuryTokens) {
    const token = findToken(tokenAddress, whitelistedTokens);
    const decimals = token?.decimals ?? 18;
    const price = Number(formatUnits(BigInt(latestPrice), priceDecimals));

    for (const { name, totalDebt } of activeStrategies) {
      const protocol = extractProtocol(name);
      const usdAmount =
        Number(formatUnits(BigInt(totalDebt), decimals)) * price;
      protocolMap.set(protocol, (protocolMap.get(protocol) ?? 0) + usdAmount);
    }
  }

  return Array.from(protocolMap.entries())
    .filter(([, amount]) => amount > 0)
    .map(([protocol, amount], index) => ({
      amount,
      color: assignColor(index),
      label: protocol,
    }));
};
