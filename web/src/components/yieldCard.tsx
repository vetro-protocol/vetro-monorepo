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
  toYieldTotal,
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

const withReserveBuffer = ({
  bufferAmount,
  label,
  yieldItems,
}: {
  bufferAmount: number;
  label: string;
  yieldItems: ReturnType<typeof toYieldItems>;
}) =>
  bufferAmount > 0
    ? [
        ...yieldItems,
        {
          amount: bufferAmount,
          apy: 0,
          color: assignColor(yieldItems.length),
          href: undefined,
          label,
        },
      ]
    : yieldItems;

export const YieldTotal = function ({
  items,
}: {
  items: { amount: number; apy: number | undefined }[];
}) {
  const { t } = useTranslation();
  if (!items.length) {
    return null;
  }
  const { amount, amountWithApy, apy } = toYieldTotal(items);
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
      <YieldDetails amount={amountWithApy} apy={apy} />
    </div>
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

  const rows =
    yieldItems &&
    withReserveBuffer({
      bufferAmount,
      label: t("common.charts.reserve-buffer-label"),
      yieldItems,
    });
  const items = rows?.map(({ amount, apy, color, href, label }) => ({
    amount,
    color,
    details: <YieldDetails amount={amount} apy={apy} />,
    href,
    label,
  }));

  const value =
    yieldItems && treasury
      ? t("common.charts.yield-value", { count: yieldItems.length })
      : "";

  return (
    <AllocationCard
      amountLabel={t("common.charts.balance-column")}
      footer={rows && <YieldTotal items={rows} />}
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
