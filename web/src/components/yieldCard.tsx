import { AllocationCard } from "components/allocationCard";
import { PieChartIcon } from "components/icons/pieChartIcon";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { usePrices } from "hooks/usePrices";
import { useWhitelistedTokensByGateway } from "hooks/useWhitelistedTokensByGateway";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import {
  assignColor,
  toReserveBufferAmount,
  toYieldItems,
} from "utils/allocations";
import { formatUsd } from "utils/currency";
import { formatPercentage } from "utils/format";

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
      <span className="w-32 text-right">
        {t("common.charts.projected-yield-column")}
      </span>
    </div>
  );
};

export const YieldDetails = function ({
  amount,
  apy,
}: {
  amount: number;
  apy: number | undefined;
}) {
  const { t } = useTranslation();
  const formattedApy = apy === undefined ? "-" : formatPercentage(apy);
  const projectedYield =
    apy === undefined ? "-" : formatUsd((amount * apy) / 100);
  return (
    <>
      <span className="text-b-medium hidden w-24 text-right text-gray-900 @md:block">
        <span className="sr-only">{t("common.charts.apy-column")} </span>
        {formattedApy}
      </span>
      <span className="text-b-medium hidden w-32 text-right text-gray-900 @md:block">
        <span className="sr-only">
          {t("common.charts.projected-yield-column")}{" "}
        </span>
        {projectedYield}
      </span>
      <div className="text-caption flex basis-full justify-between gap-3 pl-4.5 text-gray-500 @md:hidden">
        <span>
          {t("common.charts.apy-column")} {formattedApy}
        </span>
        <span>
          {t("common.charts.projected-yield-column")} {projectedYield}
        </span>
      </div>
    </>
  );
};

export const YieldCard = function ({
  peggedToken,
  peggedTokenError = false,
}: Props) {
  const { t } = useTranslation();
  const { data: whitelistedTokens, isError: isWhitelistedTokensError } =
    useWhitelistedTokensByGateway(peggedToken?.gatewayAddress);
  const {
    data: treasury,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = [
    peggedTokenError,
    isWhitelistedTokensError,
    isTreasuryError,
    isPricesError,
  ].some(Boolean);
  const isLoading =
    !isError &&
    [!peggedToken, isTreasuryLoading, !whitelistedTokens, !prices].some(
      Boolean,
    );

  const ready = prices && treasury && whitelistedTokens;
  const yieldItems = ready
    ? toYieldItems({ prices, treasuryTokens: treasury, whitelistedTokens })
    : undefined;
  const bufferAmount = ready
    ? toReserveBufferAmount({
        prices,
        treasuryTokens: treasury,
        whitelistedTokens,
      })
    : 0;

  const strategyItems = yieldItems?.map(({ amount, apy, color, label }) => ({
    amount,
    color,
    details: <YieldDetails amount={amount} apy={apy} />,
    label,
  }));
  const items =
    strategyItems && bufferAmount > 0
      ? [
          ...strategyItems,
          {
            amount: bufferAmount,
            color: assignColor(strategyItems.length),
            details: <YieldDetails amount={bufferAmount} apy={0} />,
            label: t("common.charts.reserve-buffer-label"),
          },
        ]
      : strategyItems;

  const value =
    yieldItems && treasury
      ? t("common.charts.yield-value", { count: yieldItems.length })
      : "";

  return (
    <AllocationCard
      amountLabel={t("common.charts.balance-column")}
      footnote={t("common.charts.projection-footnote")}
      header={<YieldHeader />}
      icon={<PieChartIcon className="text-blue-500" />}
      isError={isError}
      isLoading={isLoading}
      items={items}
      label={t("common.charts.yield-label")}
      value={value}
    />
  );
};
