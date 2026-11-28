import { useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { epochOptions } from "./useEpoch";
import { useEpochId } from "./useEpochId";

export function useEpochPeriod(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);
  const query = useQuery({
    ...epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
    select: ({ end, start }) => ({ end, start }),
  });

  return combineWithEpochId({ epochId, query });
}
