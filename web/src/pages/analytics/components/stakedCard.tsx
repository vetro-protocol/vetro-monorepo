import { gatewayAddresses } from "@vetro-protocol/gateway";
import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import { formatUnits } from "viem";

import { StakingIcon } from "../icons/stakingIcon";

import { AllocationCard } from "./allocationCard";

export const StakedCard = function () {
  const { t } = useTranslation();
  const { data: peggedToken, isError: isPeggedTokenError } = usePeggedToken(
    // Analytics page is VUSD only
    gatewayAddresses[0],
  );
  const {
    data: totals,
    isError: isTotalsError,
    isLoading: isTotalsLoading,
  } = useAnalyticsTotals();

  const isError = isPeggedTokenError || isTotalsError;
  const isLoading = !isError && (isTotalsLoading || !peggedToken);

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
