import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { formatUsd } from "utils/currency";
import { formatUnits } from "viem";

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
    useWhitelistedTokens(peggedToken?.gatewayAddress);
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
    peggedTokenError ||
    isWhitelistedTokensError ||
    isTreasuryError ||
    isTotalsError;

  const isLoading =
    !isError &&
    (!peggedToken ||
      isTreasuryLoading ||
      isTotalsLoading ||
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
