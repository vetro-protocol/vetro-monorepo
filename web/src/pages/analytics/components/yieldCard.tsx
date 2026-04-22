import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
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
    useWhitelistedTokens(peggedToken?.gatewayAddress);
  const {
    data: treasury,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury();

  const isError =
    peggedTokenError || isWhitelistedTokensError || isTreasuryError;
  const isLoading =
    !isError && (!peggedToken || isTreasuryLoading || !whitelistedTokens);

  const tokens = { treasuryTokens: treasury, whitelistedTokens };
  const yieldItems = toYieldItems(tokens);
  const bufferAmount = toReserveBufferAmount(tokens);
  const bufferItem =
    bufferAmount > 0
      ? {
          amount: bufferAmount,
          color: assignColor(yieldItems.length),
          label: t("pages.analytics.reserve-buffer-label"),
        }
      : null;

  const value = treasury
    ? t("pages.analytics.yield-value", { count: yieldItems.length })
    : "";

  return (
    <AllocationCard
      icon={<PieChartIcon />}
      isError={isError}
      isLoading={isLoading}
      items={bufferItem ? [...yieldItems, bufferItem] : yieldItems}
      label={t("pages.analytics.yield-label")}
      value={value}
    />
  );
};
