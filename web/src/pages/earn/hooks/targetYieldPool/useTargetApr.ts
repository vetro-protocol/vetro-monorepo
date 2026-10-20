import { useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { type Address, formatUnits } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { epochOptions } from "./useEpoch";
import { useEpochId } from "./useEpochId";

// The rate is a WAD fraction, so this equals formatUnits(rate, 18) * 100
const toApr = (rate: bigint) => Number(formatUnits(rate, 16));

export function useTargetApr(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);
  const query = useQuery({
    ...epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
    select: ({ rate }) => toApr(rate),
  });

  return combineWithEpochId({ epochId, query });
}
