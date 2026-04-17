import { gatewayAddresses } from "@vetro-protocol/gateway";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useVariableStakeExitQueue } from "hooks/useVariableStakeExitQueue";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import { formatUnits } from "viem";

import { ExitQueueIcon } from "../icons/exitQueueIcon";

import { AllocationCard } from "./allocationCard";

export const ExitQueueCard = function () {
  const { t } = useTranslation();
  const { data: peggedToken, isError: isPeggedTokenError } = usePeggedToken(
    // Analytics page is VUSD only
    gatewayAddresses[0],
  );
  const {
    data: exitQueue,
    isError: isExitQueueError,
    isLoading: isExitQueueLoading,
  } = useVariableStakeExitQueue();

  const isError = isPeggedTokenError || isExitQueueError;
  const isLoading = !isError && (isExitQueueLoading || !peggedToken);

  const value =
    peggedToken && exitQueue
      ? formatUsd(
          Number(formatUnits(exitQueue.vusdInCooldown, peggedToken.decimals)),
        )
      : "";

  return (
    <AllocationCard
      icon={<ExitQueueIcon />}
      isError={isError}
      isLoading={isLoading}
      label={t("pages.analytics.exit-queue-label")}
      value={value}
    />
  );
};
