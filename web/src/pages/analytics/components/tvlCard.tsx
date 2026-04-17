import { gatewayAddresses } from "@vetro-protocol/gateway";
import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import { formatUnits } from "viem";

import { DatabaseIcon } from "../icons/databaseIcon";
import { toTvlItems } from "../utils";

import { AllocationCard } from "./allocationCard";

export const TvlCard = function () {
  const { t } = useTranslation();
  const { data: peggedToken, isError: isPeggedTokenError } = usePeggedToken(
    // Analytics page is VUSD only
    gatewayAddresses[0],
  );
  const { data: whitelistedTokens, isError: isWhitelistedTokensError } =
    // Analytics page is VUSD only
    useWhitelistedTokens(gatewayAddresses[0]);
  const {
    data: treasury,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury();
  const {
    data: totals,
    isError: isTotalsError,
    isLoading: isTotalsLoading,
  } = useAnalyticsTotals();

  const isError =
    isPeggedTokenError ||
    isWhitelistedTokensError ||
    isTreasuryError ||
    isTotalsError;

  const isLoading =
    !isError &&
    (isTreasuryLoading ||
      isTotalsLoading ||
      !peggedToken ||
      !whitelistedTokens);

  const value =
    peggedToken && totals
      ? formatUsd(
          Number(formatUnits(BigInt(totals.vusdMinted), peggedToken.decimals)),
        )
      : "";

  return (
    <AllocationCard
      icon={<DatabaseIcon />}
      isError={isError}
      isLoading={isLoading}
      items={toTvlItems({ treasuryTokens: treasury, whitelistedTokens })}
      label={t("pages.analytics.tvl-label")}
      value={value}
    />
  );
};
