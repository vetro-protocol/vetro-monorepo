import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { useTranslation } from "react-i18next";
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
  } = useAnalyticsTotals();

  const isError = peggedTokenError || isTotalsError;
  const isLoading = !isError && (!peggedToken || isTotalsLoading);

  const value =
    peggedToken && totals
      ? formatUsd(
          Number(formatUnits(BigInt(totals.vusdStaked), peggedToken.decimals)),
        )
      : "";

  return (
    <AllocationCard
      icon={<StakingIcon />}
      isError={isError}
      isLoading={isLoading}
      label={t("pages.analytics.staked-label")}
      value={value}
    />
  );
};
