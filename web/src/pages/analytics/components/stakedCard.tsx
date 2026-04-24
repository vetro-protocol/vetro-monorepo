import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { formatUsd } from "utils/currency";
import { formatUnits } from "viem";

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
  } = useAnalyticsTotals(peggedToken?.gatewayAddress);

  const isError = peggedTokenError || isTotalsError;
  const isLoading = !isError && (!peggedToken || isTotalsLoading);

  const value =
    peggedToken && totals
      ? formatUsd(
          Number(formatUnits(BigInt(totals.staked), peggedToken.decimals)),
        )
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
