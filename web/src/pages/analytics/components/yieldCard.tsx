import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { usePrices } from "hooks/usePrices";
import { useWhitelistedTokensByGateway } from "hooks/useWhitelistedTokensByGateway";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";

import { PieChartIcon } from "../icons/pieChartIcon";
import { assignColor, toReserveBufferAmount, toYieldItems } from "../utils";

import { AllocationCard } from "./allocationCard";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

export const YieldCard = function ({ peggedToken, peggedTokenError }: Props) {
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

  const items = !yieldItems
    ? undefined
    : bufferAmount > 0
      ? [
          ...yieldItems,
          {
            amount: bufferAmount,
            color: assignColor(yieldItems.length),
            label: t("pages.analytics.reserve-buffer-label"),
          },
        ]
      : yieldItems;

  const value =
    yieldItems && treasury
      ? t("pages.analytics.yield-value", { count: yieldItems.length })
      : "";

  return (
    <AllocationCard
      icon={<PieChartIcon />}
      isError={isError}
      isLoading={isLoading}
      items={items}
      label={t("pages.analytics.yield-label")}
      value={value}
    />
  );
};
