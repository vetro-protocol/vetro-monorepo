import { useVariableStakeExitQueue } from "hooks/useVariableStakeExitQueue";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { formatUsd } from "utils/currency";
import { formatUnits } from "viem";

import { ExitQueueIcon } from "../icons/exitQueueIcon";

import { AllocationCard } from "./allocationCard";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

export const ExitQueueCard = function ({
  peggedToken,
  peggedTokenError,
}: Props) {
  const { t } = useTranslation();

  const {
    data: exitQueue,
    isError: isExitQueueError,
    isLoading: isExitQueueLoading,
  } = useVariableStakeExitQueue();

  const isError = peggedTokenError || isExitQueueError;
  const isLoading = !isError && (!peggedToken || isExitQueueLoading);

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
