import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { usePrices } from "hooks/usePrices";
import { useWhitelistedTokensByGateway } from "hooks/useWhitelistedTokensByGateway";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { formatTokenAmountUsd } from "utils/currency";

import { DatabaseIcon } from "../icons/databaseIcon";
import { toTvlItems } from "../utils";

import { AllocationCard } from "./allocationCard";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

export const TvlCard = function ({ peggedToken, peggedTokenError }: Props) {
  const { t } = useTranslation();

  const { data: whitelistedTokens, isError: isWhitelistedTokensError } =
    useWhitelistedTokensByGateway(peggedToken?.gatewayAddress);
  const {
    data: treasury,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury(peggedToken?.gatewayAddress);
  const {
    data: totals,
    isError: isTotalsError,
    isLoading: isTotalsLoading,
  } = useAnalyticsTotals(peggedToken);
  const { data: prices } = usePrices();

  const isError = [
    peggedTokenError,
    isWhitelistedTokensError,
    isTreasuryError,
    isTotalsError,
  ].some(Boolean);

  const isLoading =
    !isError &&
    [
      !peggedToken,
      isTreasuryLoading,
      isTotalsLoading,
      !whitelistedTokens,
      !prices,
    ].some(Boolean);

  const value =
    peggedToken && totals && prices
      ? formatTokenAmountUsd({
          amount: totals.minted,
          prices,
          token: peggedToken,
        })
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
