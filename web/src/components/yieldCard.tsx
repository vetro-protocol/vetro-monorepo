import { AllocationCard } from "components/allocationCard";
import { PieChartIcon } from "components/icons/pieChartIcon";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { usePeggedTokensByGateway } from "hooks/usePeggedTokensByGateway";
import { usePrices } from "hooks/usePrices";
import { useWhitelistedTokensByGateway } from "hooks/useWhitelistedTokensByGateway";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import {
  assignColor,
  toReserveBufferAmount,
  toYieldItems,
} from "utils/allocations";

type Props = {
  peggedToken: TokenWithGateway | undefined;
};

export const YieldCard = function ({ peggedToken }: Props) {
  const { t } = useTranslation();
  const { isError: isPeggedTokensError } = usePeggedTokensByGateway();
  const { data: whitelistedTokens, isError: isWhitelistedTokensError } =
    useWhitelistedTokensByGateway(peggedToken?.gatewayAddress);
  const {
    data: treasury,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = [
    isPeggedTokensError,
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

  const items = !yieldItems
    ? undefined
    : bufferAmount > 0
      ? [
          ...yieldItems,
          {
            amount: bufferAmount,
            color: assignColor(yieldItems.length),
            label: t("common.charts.reserve-buffer-label"),
          },
        ]
      : yieldItems;

  const value =
    yieldItems && treasury
      ? t("common.charts.yield-value", { count: yieldItems.length })
      : "";

  return (
    <AllocationCard
      icon={<PieChartIcon className="text-blue-500" />}
      isError={isError}
      isLoading={isLoading}
      items={items}
      label={t("common.charts.yield-label")}
      value={value}
    />
  );
};
