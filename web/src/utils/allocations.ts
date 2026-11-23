import type { StrategySource, Token } from "@vetro-protocol/core";
import type { fetchAnalyticsYield } from "fetchers/fetchAnalyticsYield";
import type { TreasuryToken, TvlHistoryEntry } from "types";
import { formatUsd, tokenAmountToUsd } from "utils/currency";
import { formatNumber, formatPercentage } from "utils/format";
import { isUsdPriceMissing } from "utils/token";
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

type YieldSummary = Awaited<ReturnType<typeof fetchAnalyticsYield>>;

// The API gives one reserve item per token, but the card shows one row for all
export const toYieldView = function ({
  prices,
  reserveBufferLabel,
  summary: { items, total },
  token,
}: {
  prices: Prices;
  reserveBufferLabel: string;
  summary: YieldSummary;
  token: Token;
}) {
  const toUsd = (amount: bigint) => tokenAmountToUsd({ amount, prices, token });
  const strategyRows = items.flatMap((item) =>
    item.type === "strategy"
      ? [
          {
            amount: toUsd(item.balance),
            apy: item.apy,
            href: item.source ? getStrategyUrl(item.source) : undefined,
            label: item.name,
            projectedYield:
              item.projectedYield === undefined
                ? undefined
                : toUsd(item.projectedYield),
          },
        ]
      : [],
  );
  const reserveBuffer = items
    .filter((item) => item.type === "reserve")
    .reduce((sum, item) => sum + item.balance, 0n);
  const rows =
    reserveBuffer > 0n
      ? [
          ...strategyRows,
          {
            amount: toUsd(reserveBuffer),
            apy: 0,
            href: undefined,
            label: reserveBufferLabel,
            projectedYield: 0,
          },
        ]
      : strategyRows;
  return {
    rows: rows.map((row, index) => ({ ...row, color: assignColor(index) })),
    strategyCount: strategyRows.length,
    total: {
      amount: toUsd(total.balance),
      apy: total.apy ?? undefined,
      projectedYield:
        total.projectedYield === null ? undefined : toUsd(total.projectedYield),
    },
  };
};

// Formats a raw pegged token amount in USD, or "-" when the pegged token has
// no price, because its USD value is unknown.
export const formatPeggedAmountUsd = ({
  amount,
  prices,
  token,
}: {
  amount: bigint;
  prices: Prices;
  token: Token;
}) =>
  !isUsdPriceMissing({ prices, token })
    ? formatUsd(tokenAmountToUsd({ amount, prices, token }))
    : "-";

// Transforms /analytics/balance-sheet response into the supply and
// surplus (or deficit) items. The bar has no segment for a deficit, because a
// bar cannot show a negative value.
export const toBalanceSheetItems = function ({
  data,
  labels,
  prices,
  token,
}: {
  data: { ratio: number; supply: string; surplus: string };
  labels: {
    deficit: (percentage: string) => string;
    supply: string;
    surplus: (percentage: string) => string;
  };
  prices: Prices;
  token: Token;
}) {
  const supply = BigInt(data.supply);
  const surplus = BigInt(data.surplus);
  const isDeficit = surplus < 0n;
  const absoluteSurplus = isDeficit ? -surplus : surplus;
  const hasPrice = !isUsdPriceMissing({ prices, token });
  const percentage =
    supply > 0n ? formatPercentage(Math.abs(data.ratio - 100)) : "-";

  const barSurplus = isDeficit ? 0n : surplus;
  const barTotal = supply + barSurplus;
  const toBarShare = (amount: bigint) =>
    barTotal > 0n ? Number((amount * 10000n) / barTotal) / 100 : 0;

  const getSurplusText = function () {
    if (!hasPrice) {
      return "-";
    }
    const surplusUsd = tokenAmountToUsd({
      amount: absoluteSurplus,
      prices,
      token,
    });
    if (isDeficit) {
      return formatUsd(-surplusUsd);
    }
    return surplusUsd >= 0.01
      ? `+${formatUsd(surplusUsd)}`
      : formatUsd(surplusUsd);
  };

  const getSurplusClassName = function () {
    if (!hasPrice) {
      return undefined;
    }
    return isDeficit ? "text-rose-500" : "text-emerald-500";
  };

  return [
    {
      amount: toBarShare(supply),
      color: "bg-blue-500",
      formattedAmount: formatPeggedAmountUsd({ amount: supply, prices, token }),
      label: labels.supply,
    },
    {
      amount: toBarShare(barSurplus),
      amountClassName: getSurplusClassName(),
      color: isDeficit ? "bg-rose-500" : "bg-emerald-400",
      formattedAmount: getSurplusText(),
      label: isDeficit
        ? labels.deficit(percentage)
        : labels.surplus(percentage),
    },
  ];
};
