import { AllocationCard } from "components/allocationCard";
import { InfoIcon } from "components/icons/infoIcon";
import { PieChartIcon } from "components/icons/pieChartIcon";
import { Tooltip } from "components/tooltip";
import { useAnalyticsYield } from "hooks/useAnalyticsYield";
import { usePrices } from "hooks/usePrices";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { toYieldView } from "utils/allocations";
import { formatUsd } from "utils/currency";
import { formatPercentage } from "utils/format";
import { isUsdPriceMissing } from "utils/token";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError?: boolean;
};

export const YieldHeader = function () {
  const { t } = useTranslation();
  return (
    <div className="text-b-medium hidden gap-3 border-b border-gray-200 py-3 text-gray-500 @md:flex">
      <span className="flex-1">{t("common.charts.strategy-column")}</span>
      <span className="w-24 text-right">
        {t("common.charts.balance-column")}
      </span>
      <span className="w-24 text-right">{t("common.charts.apy-column")}</span>
      <span className="flex w-40 items-center justify-end gap-1">
        {t("common.charts.projected-yield-column")}
        <Tooltip content={t("common.charts.projected-yield-tooltip")}>
          <InfoIcon />
        </Tooltip>
      </span>
    </div>
  );
};

export const YieldDetails = function ({
  apy,
  projectedYield,
}: {
  apy: number | undefined;
  projectedYield: number | undefined;
}) {
  const { t } = useTranslation();
  const formattedApy = apy === undefined ? "-" : formatPercentage(apy);
  const formattedYield =
    projectedYield === undefined ? "-" : formatUsd(projectedYield);
  return (
    <>
      <span className="text-b-medium hidden w-24 text-right text-gray-900 @md:block">
        <span className="sr-only">{t("common.charts.apy-column")} </span>
        {formattedApy}
      </span>
      <span className="text-b-medium hidden w-40 text-right text-gray-900 @md:block">
        <span className="sr-only">
          {t("common.charts.projected-yield-column")}{" "}
        </span>
        {formattedYield}
      </span>
      <div className="text-caption flex basis-full justify-between gap-3 pl-4.5 text-gray-500 @md:hidden">
        <span>
          {t("common.charts.apy-column")} {formattedApy}
        </span>
        <span>
          {t("common.charts.projected-yield-column")} {formattedYield}
        </span>
      </div>
    </>
  );
};

export const YieldTotal = function ({
  amount,
  apy,
  projectedYield,
}: {
  amount: number;
  apy: number | undefined;
  projectedYield: number | undefined;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="size-1.5 shrink-0" />
        <span className="text-b-medium text-gray-900">
          {t("common.charts.total-label")}
        </span>
      </div>
      <span className="text-b-medium text-right text-gray-900 @md:w-24">
        <span className="sr-only">{t("common.charts.balance-column")} </span>
        {formatUsd(amount)}
      </span>
      <YieldDetails apy={apy} projectedYield={projectedYield} />
    </div>
  );
};

export const YieldCard = function ({
  peggedToken,
  peggedTokenError = false,
}: Props) {
  const { t } = useTranslation();
  const {
    data: yieldSummary,
    isError: isYieldError,
    isLoading: isYieldLoading,
  } = useAnalyticsYield(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = [
    peggedTokenError,
    isYieldError && !yieldSummary,
    isPricesError && !prices,
    isUsdPriceMissing({ prices, token: peggedToken }),
  ].some(Boolean);
  const isLoading =
    !isError && [!peggedToken, isYieldLoading, !prices].some(Boolean);

  const view =
    peggedToken && prices && yieldSummary
      ? toYieldView({
          prices,
          reserveBufferLabel: t("common.charts.reserve-buffer-label"),
          summary: yieldSummary,
          token: peggedToken,
        })
      : undefined;

  return (
    <AllocationCard
      amountLabel={t("common.charts.balance-column")}
      footer={view?.rows.length ? <YieldTotal {...view.total} /> : undefined}
      footnote={t("common.charts.projection-footnote")}
      header={<YieldHeader />}
      icon={<PieChartIcon className="text-blue-500" />}
      isError={isError}
      isLoading={isLoading}
      items={view?.rows.map(
        ({ amount, apy, color, href, label, projectedYield }) => ({
          amount,
          color,
          details: <YieldDetails apy={apy} projectedYield={projectedYield} />,
          href,
          label,
        }),
      )}
      label={t("common.charts.yield-label")}
      value={
        view
          ? t("common.charts.yield-value", { count: view.strategyCount })
          : ""
      }
    />
  );
};
