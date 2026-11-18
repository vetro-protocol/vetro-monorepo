import type { StrategySource, Token } from "@vetro-protocol/core";
import type { TreasuryToken, TvlHistoryEntry } from "types";
import { tokenAmountToUsd } from "utils/currency";
import { formatNumber } from "utils/format";
import { getStakeDaoStrategyUrl } from "utils/url";
import { formatUnits, isAddressEqual, type Address } from "viem";

type Prices = Record<string, string>;

const colorPalette = [
  "bg-emerald-400",
  "bg-blue-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-purple-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-pink-400",
];

export const assignColor = (index: number) =>
  colorPalette[index % colorPalette.length] ?? "bg-gray-400";

const assignChartColor = (index: number) =>
  assignColor(index).replace(/^bg-(.+)$/, "var(--color-$1)");

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

export const getHistoryOnlyTokenAddresses = ({
  history,
  whitelistedTokens,
}: {
  history: TvlHistoryEntry[];
  whitelistedTokens: Token[];
}) =>
  history
    .flatMap((entry) => entry.tokens.map((token) => token.tokenAddress))
    .filter(
      (address, index, addresses) =>
        !findToken(address, whitelistedTokens) &&
        addresses.findIndex((candidate) =>
          isAddressEqual(candidate, address),
        ) === index,
    );

export const toTvlHistorySeries = ({
  history,
  tokens,
}: {
  history: TvlHistoryEntry[];
  tokens: Token[];
}) =>
  tokens.map((token, index) => ({
    address: token.address,
    color: assignChartColor(index),
    data: history.map(function (entry) {
      const holding = entry.tokens.find((candidate) =>
        isAddressEqual(candidate.tokenAddress, token.address),
      );
      const rate =
        holding?.price && holding.unitPrice
          ? Number(holding.price) / Number(holding.unitPrice)
          : 0;
      return {
        x: entry.timestamp,
        y:
          Number(
            formatUnits(BigInt(holding?.withdrawable ?? 0), token.decimals),
          ) *
          rate *
          (entry.pegBaseUsdPrice ?? 0),
      };
    }),
    symbol: token.symbol,
  }));

const getStrategyUrl = function (source: StrategySource) {
  if (source.protocol === "lagoon") {
    return `https://app.lagoon.finance/vault/1/${source.vaultAddress}`;
  }
  if (source.protocol === "morpho") {
    return `https://app.morpho.org/ethereum/vault/${source.vaultAddress}`;
  }
  if (source.protocol === "stakeDao") {
    return getStakeDaoStrategyUrl(source.strategyKey);
  }
  // make compilation fail if a new protocol was added, and keep a protocol
  // that only a newer API knows without a link
  source satisfies never;
  return undefined;
};

// Transforms /analytics/treasury response into yield allocation items,
// one item per active strategy across all tokens, sorted by USD amount (largest first).
export const toYieldItems = ({
  prices,
  treasuryTokens,
  whitelistedTokens,
}: {
  prices: Prices;
  treasuryTokens: TreasuryToken[];
  whitelistedTokens: Token[];
}) =>
  treasuryTokens
    .flatMap(function ({ activeStrategies, tokenAddress }) {
      const token = findToken(tokenAddress, whitelistedTokens);
      if (!token) {
        return [];
      }
      return activeStrategies.map(({ apy, name, source, totalDebt }) => ({
        amount: tokenAmountToUsd({
          amount: BigInt(totalDebt),
          prices,
          token,
        }),
        apy,
        href: source ? getStrategyUrl(source) : undefined,
        label: name,
      }));
    })
    .sort((a, b) => b.amount - a.amount)
    .map(({ amount, apy, href, label }, index) => ({
      amount,
      apy,
      color: assignColor(index),
      href,
      label,
    }));

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

/** Weighted average of the APYs by amount */
export const toYieldTotal = function (
  items: { amount: number; apy: number | undefined }[],
) {
  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  const withApy = items.filter(({ apy }) => apy !== undefined);
  const amountWithApy = withApy.reduce((sum, item) => sum + item.amount, 0);
  if (amountWithApy <= 0) {
    return { amount, amountWithApy, apy: undefined };
  }
  const weightedApy = withApy.reduce(
    (sum, item) => sum + item.amount * (item.apy ?? 0),
    0,
  );
  return { amount, amountWithApy, apy: weightedApy / amountWithApy };
};
