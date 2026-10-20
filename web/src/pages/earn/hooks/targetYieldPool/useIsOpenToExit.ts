import { type UseQueryResult, useQueries } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useNowTickingPast } from "hooks/useNowTickingPast";
import { isOpenToExit } from "pages/earn/components/fixedTermEarn/isOpenToExit";
import { unixNowTimestamp } from "utils/date";
import { combineQueryResults } from "utils/queries";
import type { Address } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { type Epoch, epochOptions } from "./useEpoch";
import { epochIdOptions, useEpochId } from "./useEpochId";
import { isShutdownOptions } from "./useIsShutdown";
import { isTerminatedOptions } from "./useIsTerminated";

const combineExitState = ([epochId, epoch, isShutdown, isTerminated]: [
  UseQueryResult<bigint>,
  UseQueryResult<Epoch>,
  UseQueryResult<boolean>,
  UseQueryResult<boolean>,
]) =>
  combineWithEpochId({
    epochId,
    query: combineQueryResults({
      results: [epoch, isShutdown, isTerminated],
      select: ([epochData, isShutdownData, isTerminatedData]) => ({
        exitWindow: epochData.exitWindow,
        isShutdown: isShutdownData,
        isTerminated: isTerminatedData,
      }),
    }),
  });

export function useIsOpenToExit(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);
  const exitState = useQueries({
    combine: combineExitState,
    queries: [
      epochIdOptions({ client, stakingVaultAddress }),
      epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
      isShutdownOptions({ client, stakingVaultAddress }),
      isTerminatedOptions({ client, stakingVaultAddress }),
    ],
  });
  const { data } = exitState;

  useNowTickingPast(
    data ? [data.exitWindow.start, data.exitWindow.end] : undefined,
    (timestamp) => Number(timestamp),
  );

  function getIsOpenToExit() {
    if (data === undefined) {
      return undefined;
    }
    return (
      data !== null &&
      isOpenToExit({ ...data, now: BigInt(unixNowTimestamp()) })
    );
  }

  return { ...exitState, data: getIsOpenToExit() };
}
