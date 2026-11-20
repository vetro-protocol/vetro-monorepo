import { AllocationCard } from "components/allocationCard";
import { Badge } from "components/base/badge";
import { TrendingUpIcon } from "components/icons/trendingUpIcon";
import { useAnalyticsNetRevenue } from "hooks/useAnalyticsNetRevenue";
import { usePrices } from "hooks/usePrices";
import { useShareTokenForPeggedToken } from "hooks/useShareTokenForPeggedToken";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { formatUsd, tokenAmountToUsd } from "utils/currency";
import { formatNumberWithOptions, formatPercentage } from "utils/format";
import {
  formatSignedUsd,
  type NetRevenueStatus,
  toNetRevenueView,
} from "utils/netRevenue";
import { isUsdPriceMissing } from "utils/token";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError?: boolean;
};

const statusStyles = {
  breakeven: {
    labelKey: "pages.analytics.net-revenue-status-breakeven",
    variant: "gray",
  },
  negative: {
    amount: "text-rose-700",
    dot: "bg-rose-500",
    labelKey: "pages.analytics.net-revenue-status-negative",
    variant: "light-red",
  },
  positive: {
    amount: "text-emerald-700",
    dot: "bg-emerald-400",
    labelKey: "pages.analytics.net-revenue-status-positive",
    variant: "green",
  },
} as const;

const formatOrDash = <T,>({
  format,
  value,
}: {
  format: (input: T) => string;
  value: T | null;
}) => (value === null ? "-" : format(value));

const joinParts = (parts: (string | false | null)[]) =>
  parts.filter(Boolean).join(" · ");

type View = ReturnType<typeof toNetRevenueView>;

const getCoverage = function ({ t, view }: { t: TFunction; view: View }) {
  if (view.coverageRatio === null) {
    return null;
  }
  if (view.status === "breakeven") {
    return t("pages.analytics.net-revenue-coverage-breakeven");
  }
  return view.status === "positive"
    ? t("pages.analytics.net-revenue-coverage-positive", {
        ratio: formatNumberWithOptions({
          options: { maximumFractionDigits: 1 },
          value: view.coverageRatio,
        }),
      })
    : t("pages.analytics.net-revenue-coverage-negative", {
        percentage: formatPercentage(view.coverageRatio * 100),
      });
};

const getNetSubLabel = function ({ t, view }: { t: TFunction; view: View }) {
  if (view.status === "positive") {
    return joinParts([
      t("pages.analytics.net-revenue-kept-sublabel"),
      view.keptOfBackend !== null &&
        t("pages.analytics.net-revenue-share-of-backend", {
          percentage: formatPercentage(view.keptOfBackend),
        }),
    ]);
  }
  if (view.status === "negative") {
    return joinParts([
      t("pages.analytics.net-revenue-shortfall-sublabel"),
      view.shortfallOfPayouts !== null &&
        t("pages.analytics.net-revenue-share-of-payouts", {
          percentage: formatPercentage(view.shortfallOfPayouts),
        }),
    ]);
  }
  return view.status === "breakeven"
    ? t("pages.analytics.net-revenue-breakeven-sublabel")
    : "-";
};

const getNetStyle = (status: View["status"]) =>
  status === "negative" || status === "positive"
    ? statusStyles[status]
    : undefined;

const toNetItem = ({ t, view }: { t: TFunction; view: View }) => ({
  amount: view.segments.net,
  amountClassName: getNetStyle(view.status)?.amount,
  color: getNetStyle(view.status)?.dot ?? "",
  formattedAmount: formatOrDash({
    format: formatSignedUsd,
    value: view.netRevenue,
  }),
  label: t("pages.analytics.net-revenue-label"),
  labelClassName: "text-xsm font-semibold",
  subLabel: getNetSubLabel({ t, view }),
});

type NetRevenueValues = {
  backendApy: number | null;
  backendBalance: number;
  backendYield: number | null;
  netRevenue: number | null;
  staked: number;
  stakerApr: number | null;
  stakerPayouts: number | null;
};

const toItems = function ({
  shareSymbol,
  t,
  values,
  view,
}: {
  shareSymbol: string;
  t: TFunction;
  values: NetRevenueValues;
  view: View;
}) {
  const { segments, status } = view;
  return [
    {
      amount: segments.backend,
      color: segments.backend > 0 ? "bg-blue-500" : "",
      formattedAmount: formatOrDash({
        format: formatUsd,
        value: values.backendYield,
      }),
      label: t("pages.analytics.net-revenue-backend-label"),
      subLabel: joinParts([
        t("pages.analytics.net-revenue-backend-sublabel", {
          amount: formatUsd(values.backendBalance),
          apy: formatOrDash({
            format: formatPercentage,
            value: values.backendApy,
          }),
        }),
        status === "negative" &&
          t("pages.analytics.net-revenue-backend-all-to-stakers"),
      ]),
    },
    {
      amount: segments.paid,
      color: segments.paid > 0 ? "bg-blue-500" : "",
      formattedAmount: formatOrDash({
        format: (value) => formatSignedUsd(-value),
        value: values.stakerPayouts,
      }),
      label: t("pages.analytics.net-revenue-paid-label", { shareSymbol }),
      subLabel: joinParts([
        t("pages.analytics.net-revenue-paid-sublabel", {
          amount: formatUsd(values.staked),
          apr: formatOrDash({
            format: formatPercentage,
            value: values.stakerApr,
          }),
        }),
        status !== "negative" &&
          view.payoutsOfBackend !== null &&
          t("pages.analytics.net-revenue-share-of-backend", {
            percentage: formatPercentage(view.payoutsOfBackend),
          }),
      ]),
    },
    toNetItem({ t, view }),
  ];
};

const NetRevenueLabel = function ({
  status,
}: {
  status: NetRevenueStatus | undefined;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-2">
      {t("pages.analytics.net-revenue-label")}
      {status && (
        <Badge variant={statusStyles[status].variant}>
          {t(statusStyles[status].labelKey)}
        </Badge>
      )}
    </span>
  );
};

export const NetRevenueContent = function ({
  isError,
  isLoading,
  shareSymbol,
  values,
}: {
  isError: boolean;
  isLoading: boolean;
  shareSymbol: string | undefined;
  values: NetRevenueValues | undefined;
}) {
  const { t } = useTranslation();
  const cardProps = {
    footnote: shareSymbol
      ? t("pages.analytics.net-revenue-footnote", { shareSymbol })
      : undefined,
    icon: <TrendingUpIcon className="text-blue-500" />,
    isError,
    isLoading,
  };

  if (isError || !values || !shareSymbol) {
    return (
      <AllocationCard
        {...cardProps}
        items={[]}
        label={<NetRevenueLabel status={undefined} />}
        value=""
      />
    );
  }

  const view = toNetRevenueView(values);
  return (
    <AllocationCard
      {...cardProps}
      description={joinParts([
        t("pages.analytics.net-revenue-per-month", {
          amount: formatOrDash({
            format: formatSignedUsd,
            value: view.perMonth,
          }),
        }),
        getCoverage({ t, view }),
      ])}
      items={toItems({ shareSymbol, t, values, view })}
      label={<NetRevenueLabel status={view.status} />}
      suffix={
        view.netRevenue === null
          ? undefined
          : t("pages.analytics.net-revenue-per-year")
      }
      value={formatOrDash({ format: formatSignedUsd, value: view.netRevenue })}
    />
  );
};

export const NetRevenueCard = function ({
  peggedToken,
  peggedTokenError = false,
}: Props) {
  const {
    data,
    isError: isNetRevenueError,
    isLoading: isNetRevenueLoading,
  } = useAnalyticsNetRevenue(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();
  const { data: shareToken, isError: isShareTokenError } =
    useShareTokenForPeggedToken({ peggedToken });

  const isError = [
    peggedTokenError,
    isNetRevenueError && !data,
    isPricesError && !prices,
    isShareTokenError && !shareToken,
    isUsdPriceMissing({ prices, token: peggedToken }),
  ].some(Boolean);
  const isLoading =
    !isError &&
    [!peggedToken, isNetRevenueLoading, !prices, !shareToken].some(Boolean);

  const getValues = function () {
    if (!peggedToken || !prices || !data) {
      return undefined;
    }
    const toUsd = (amount: bigint) =>
      tokenAmountToUsd({ amount, prices, token: peggedToken });
    const toUsdOrNull = (amount: bigint | null) =>
      amount === null ? null : toUsd(amount);
    return {
      backendApy: data.backendApy,
      backendBalance: toUsd(data.backendBalance),
      backendYield: toUsdOrNull(data.backendYield),
      netRevenue: toUsdOrNull(data.netRevenue),
      staked: toUsd(data.staked),
      stakerApr: data.stakerApr,
      stakerPayouts: toUsdOrNull(data.stakerPayouts),
    };
  };

  return (
    <NetRevenueContent
      isError={isError}
      isLoading={isLoading}
      shareSymbol={shareToken?.symbol}
      values={getValues()}
    />
  );
};
