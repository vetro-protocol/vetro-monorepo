import { useTargetApr } from "pages/earn/hooks/targetYieldPool/useTargetApr";
import Skeleton from "react-loading-skeleton";
import { formatPercentage } from "utils/format";
import type { Address } from "viem";

type Props = {
  stakingVaultAddress: Address;
};

export function TargetAprValue({ stakingVaultAddress }: Props) {
  const { data: targetApr, isPending } = useTargetApr(stakingVaultAddress);

  if (targetApr !== undefined && targetApr !== null) {
    return formatPercentage(targetApr);
  }
  return isPending ? <Skeleton inline width={50} /> : "-";
}
