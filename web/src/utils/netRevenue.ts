import { formatUsd } from "utils/currency";

type NetRevenueUsd = {
  backendYield: number | null;
  netRevenue: number | null;
  stakerPayouts: number | null;
};

// Uses "−" (U+2212) for negatives, as the design does
export const formatSignedUsd = function (value: number) {
  if (value === 0) {
    return formatUsd(0);
  }
  const sign = value > 0 ? "+" : "−";
  const absolute = Math.abs(value);
  return absolute < 0.01 ? `< ${sign}$0.01` : `${sign}${formatUsd(absolute)}`;
};

export type NetRevenueStatus = "breakeven" | "negative" | "positive";

const toRatio = ({
  denominator,
  numerator,
}: {
  denominator: number | null;
  numerator: number | null;
}) =>
  numerator === null || denominator === null || denominator <= 0
    ? null
    : numerator / denominator;

const toPercentage = function (args: Parameters<typeof toRatio>[0]) {
  const ratio = toRatio(args);
  return ratio === null ? null : ratio * 100;
};

// The status follows the value shown, so a net that shows as "$0" is breakeven
const roundToCents = function (value: number) {
  const rounded = Math.round(value * 100) / 100;
  // Math.round gives -0 for small negatives, which formats as "-$0"
  return rounded === 0 ? 0 : rounded;
};

const getStatus = function (net: number | null): NetRevenueStatus | undefined {
  if (net === null) {
    return undefined;
  }
  if (net > 0) {
    return "positive";
  }
  return net < 0 ? "negative" : "breakeven";
};

const getSegments = function ({
  backendYield,
  net,
  stakerPayouts,
}: {
  backendYield: number | null;
  net: number | null;
  stakerPayouts: number | null;
}) {
  if (net === null) {
    return { backend: 0, net: 0, paid: 0 };
  }
  if (net < 0) {
    return { backend: backendYield ?? 0, net: -net, paid: 0 };
  }
  return { backend: 0, net, paid: stakerPayouts ?? 0 };
};

/**
 * Derives what the Net protocol revenue card shows from the USD values of
 * `GET /analytics/net-revenue`. Percentages are numbers (`38` means 38%).
 * The bar spans the backend yield when the net is positive, and the staker
 * payouts when it is negative.
 */
export const toNetRevenueView = function ({
  backendYield,
  netRevenue,
  stakerPayouts,
}: NetRevenueUsd) {
  const net = netRevenue === null ? null : roundToCents(netRevenue);
  return {
    coverageRatio: toRatio({
      denominator: stakerPayouts,
      numerator: backendYield,
    }),
    keptOfBackend: toPercentage({
      denominator: backendYield,
      numerator: net === null ? null : Math.max(net, 0),
    }),
    netRevenue: net,
    payoutsOfBackend: toPercentage({
      denominator: backendYield,
      numerator: stakerPayouts,
    }),
    perMonth: net === null ? null : net / 12,
    segments: getSegments({ backendYield, net, stakerPayouts }),
    shortfallOfPayouts: toPercentage({
      denominator: stakerPayouts,
      numerator: net === null ? null : Math.max(-net, 0),
    }),
    status: getStatus(net),
  };
};
