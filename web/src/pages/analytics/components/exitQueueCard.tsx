import { useVariableStakeExitQueue } from "hooks/useVariableStakeExitQueue";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
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
  } = useVariableStakeExitQueue(peggedToken?.gatewayAddress);

  const isError = peggedTokenError || isExitQueueError;
  const isLoading = !isError && (!peggedToken || isExitQueueLoading);

  const value =
    peggedToken && exitQueue
      ? formatUsd(
          Number(formatUnits(exitQueue.assetsInCooldown, peggedToken.decimals)),
        )
      : "";

  const label = peggedToken ? (
    t("pages.analytics.exit-queue-label", { symbol: peggedToken.symbol })
  ) : (
    <Skeleton width={240} />
  );

  return (
    <AllocationCard
      icon={<ExitQueueIcon />}
      isError={isError}
      isLoading={isLoading}
      label={label}
      value={value}
    />
  );
};
