import { type UseQueryResult, useQueries } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { isOpenToExit } from "pages/earn/components/fixedTermEarn/isOpenToExit";
import { unixNowTimestamp } from "utils/date";
import { combineQueryResults } from "utils/queries";
import type { Address } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { type Epoch, epochOptions } from "./useEpoch";
import { epochIdOptions, useEpochId } from "./useEpochId";
import { isShutdownOptions } from "./useIsShutdown";
import { isTerminatedOptions } from "./useIsTerminated";

const combineIsOpenToExit = ([epochId, epoch, isShutdown, isTerminated]: [
  UseQueryResult<bigint>,
  UseQueryResult<Epoch>,
  UseQueryResult<boolean>,
  UseQueryResult<boolean>,
]) =>
  combineWithEpochId({
    epochId,
    query: combineQueryResults({
      results: [epoch, isShutdown, isTerminated],
      select: ([epochData, isShutdownData, isTerminatedData]) =>
        isOpenToExit({
          exitWindow: epochData.exitWindow,
          isShutdown: isShutdownData,
          isTerminated: isTerminatedData,
          now: BigInt(unixNowTimestamp()),
        }),
    }),
  });

export function useIsOpenToExit(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);

  return useQueries({
    combine: combineIsOpenToExit,
    queries: [
      epochIdOptions({ client, stakingVaultAddress }),
      epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
      isShutdownOptions({ client, stakingVaultAddress }),
      isTerminatedOptions({ client, stakingVaultAddress }),
    ],
  });
}
