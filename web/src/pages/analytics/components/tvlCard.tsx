import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { useAnalyticsTvl } from "hooks/useAnalyticsTvl";
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
    data: tvl,
    isError: isTvlError,
    isLoading: isTvlLoading,
  } = useAnalyticsTvl(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = [
    peggedTokenError,
    isWhitelistedTokensError,
    isTreasuryError,
    isTvlError,
    isPricesError,
  ].some(Boolean);

  const isLoading =
    !isError &&
    [
      !peggedToken,
      isTreasuryLoading,
      isTvlLoading,
      !whitelistedTokens,
      !prices,
    ].some(Boolean);

  const value =
    peggedToken && tvl && prices
      ? formatTokenAmountUsd({
          amount: tvl.minted,
          prices,
          token: peggedToken,
        })
      : "";

  return (
    <AllocationCard
      icon={<DatabaseIcon />}
      isError={isError}
      isLoading={isLoading}
      items={
        prices && treasury && whitelistedTokens
          ? toTvlItems({
              prices,
              treasuryTokens: treasury,
              whitelistedTokens,
            })
          : undefined
      }
      label={t("pages.analytics.tvl-label")}
      value={value}
    />
  );
};
