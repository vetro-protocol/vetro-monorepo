import { knownTokens } from "utils/tokenList";

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

const assignColor = (index: number) =>
  colorPalette[index % colorPalette.length] ?? "bg-gray-400";

// Extracts the protocol name from a strategy name.
// e.g. "Morpho SkyMoney USDT Savings" → "Morpho"
const extractProtocol = (strategyName: string) =>
  strategyName.split(" ")[0] ?? strategyName;

// Transforms /analytics/treasury response into TVL allocation items.
// amount is a placeholder proportional to totalDebt — real USD computation
// (using tokenDecimals × latestPrice) will be added when integrating the live API.
export const toTvlItems = (tokens: TreasuryToken[]): AllocationItem[] =>
  tokens.map(({ tokenAddress, totalDebt }, index) => ({
    amount: Number(totalDebt),
    color: assignColor(index),
    label:
      knownTokens.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase(),
      )?.symbol ?? tokenAddress.slice(0, 6),
  }));

// Transforms /analytics/treasury response into yield allocation items,
// grouping active strategies by protocol across all tokens.
// amount is a placeholder proportional to strategy count — real USD computation
// will be added when integrating the live API.
export const toYieldItems = function (
  tokens: TreasuryToken[],
): AllocationItem[] {
  const protocolMap = new Map<string, number>();

  for (const { activeStrategies } of tokens) {
    for (const { name } of activeStrategies) {
      const protocol = extractProtocol(name);
      protocolMap.set(protocol, (protocolMap.get(protocol) ?? 0) + 1);
    }
  }

  return Array.from(protocolMap.entries()).map(([protocol, count], index) => ({
    amount: count,
    color: assignColor(index),
    label: protocol,
  }));
};
