import { useEpochEndDate } from "pages/earn/hooks/targetYieldPool/useEpochEndDate";
import Skeleton from "react-loading-skeleton";
import type { Address } from "viem";

type Props = {
  stakingVaultAddress: Address;
};

export function EpochEndDateValue({ stakingVaultAddress }: Props) {
  const { data: epochEndDate, isError } = useEpochEndDate(stakingVaultAddress);

  if (isError) {
    return "-";
  }
  if (epochEndDate === undefined) {
    return <Skeleton inline width={80} />;
  }
  return epochEndDate ?? "-";
}
