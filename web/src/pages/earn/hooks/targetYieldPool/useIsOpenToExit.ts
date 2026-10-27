import {
  type UseQueryResult,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useNowTickingPast } from "hooks/useNowTickingPast";
import { isOpenToExit } from "pages/earn/components/fixedTermEarn/isOpenToExit";
import { combineQueryResults } from "utils/queries";
import type { Address } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { type Epoch, epochOptions } from "./useEpoch";
import { epochIdOptions, useEpochId } from "./useEpochId";
import { isShutdownOptions } from "./useIsShutdown";
import { isTerminatedOptions } from "./useIsTerminated";

const combineExitState = ({
  now,
  results: [epochId, epoch, isShutdown, isTerminated],
}: {
  now: bigint;
  results: [
    UseQueryResult<bigint>,
    UseQueryResult<Epoch>,
    UseQueryResult<boolean>,
    UseQueryResult<boolean>,
  ];
}) =>
  combineWithEpochId({
    epochId,
    query: combineQueryResults({
      results: [epoch, isShutdown, isTerminated],
      select: ([epochData, isShutdownData, isTerminatedData]) =>
        isOpenToExit({
          exitWindow: epochData.exitWindow,
          isShutdown: isShutdownData,
          isTerminated: isTerminatedData,
          now,
        }),
    }),
  });

export function useIsOpenToExit(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);
  const { data: epoch } = useQuery(
    epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
  );

  const now = BigInt(
    useNowTickingPast(
      epoch ? [epoch.exitWindow.start, epoch.exitWindow.end] : undefined,
      (timestamp) => Number(timestamp),
    ),
  );

  return useQueries({
    combine: (results) => combineExitState({ now, results }),
    queries: [
      epochIdOptions({ client, stakingVaultAddress }),
      epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
      isShutdownOptions({ client, stakingVaultAddress }),
      isTerminatedOptions({ client, stakingVaultAddress }),
    ],
  });
}
