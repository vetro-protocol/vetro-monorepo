import { type UseQueryResult, useQueries } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { combineQueryResults } from "utils/queries";
import type { Address } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { type Epoch, epochOptions } from "./useEpoch";
import { epochIdOptions, useEpochId } from "./useEpochId";
import { isPausedOptions } from "./useIsPaused";
import { isShutdownOptions } from "./useIsShutdown";
import { isTerminatedOptions } from "./useIsTerminated";

const combineDepositState = ([
  epochId,
  epoch,
  isPaused,
  isShutdown,
  isTerminated,
]: [
  UseQueryResult<bigint>,
  UseQueryResult<Epoch>,
  UseQueryResult<boolean>,
  UseQueryResult<boolean>,
  UseQueryResult<boolean>,
]) =>
  combineWithEpochId({
    epochId,
    query: combineQueryResults({
      results: [epoch, isPaused, isShutdown, isTerminated],
      select: ([
        epochData,
        isPausedData,
        isShutdownData,
        isTerminatedData,
      ]) => ({
        ...epochData,
        isPaused: isPausedData,
        isShutdown: isShutdownData,
        isTerminated: isTerminatedData,
      }),
    }),
  });

export function useDepositState(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);

  return useQueries({
    combine: combineDepositState,
    queries: [
      epochIdOptions({ client, stakingVaultAddress }),
      epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
      isPausedOptions({ client, stakingVaultAddress }),
      isShutdownOptions({ client, stakingVaultAddress }),
      isTerminatedOptions({ client, stakingVaultAddress }),
    ],
  });
}
