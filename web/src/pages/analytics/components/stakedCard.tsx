import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { usePrices } from "hooks/usePrices";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { formatTokenAmountUsd } from "utils/currency";

import { StakingIcon } from "../icons/stakingIcon";

import { AllocationCard } from "./allocationCard";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

export const StakedCard = function ({ peggedToken, peggedTokenError }: Props) {
  const { t } = useTranslation();
  const {
    data: totals,
    isError: isTotalsError,
    isLoading: isTotalsLoading,
  } = useAnalyticsTotals(peggedToken);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = peggedTokenError || isTotalsError || isPricesError;
  const isLoading = !isError && (!peggedToken || isTotalsLoading || !prices);

  const value =
    peggedToken && totals && prices
      ? formatTokenAmountUsd({
          amount: totals.staked,
          prices,
          token: peggedToken,
        })
      : "";

  const label = peggedToken ? (
    t("pages.analytics.staked-label", { symbol: peggedToken.symbol })
  ) : (
    <Skeleton width={160} />
  );

  return (
    <AllocationCard
      icon={<StakingIcon />}
      isError={isError}
      isLoading={isLoading}
      label={label}
      value={value}
    />
  );
};
