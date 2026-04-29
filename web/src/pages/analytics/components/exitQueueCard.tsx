import { usePrices } from "hooks/usePrices";
import { useVariableStakeExitQueue } from "hooks/useVariableStakeExitQueue";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { formatTokenAmountUsd } from "utils/currency";

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
  const { data: prices } = usePrices();

  const isError = peggedTokenError || isExitQueueError;
  const isLoading = !isError && (!peggedToken || isExitQueueLoading || !prices);

  const value =
    peggedToken && exitQueue && prices
      ? formatTokenAmountUsd({
          amount: exitQueue.assetsInCooldown,
          prices,
          token: peggedToken,
        })
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
