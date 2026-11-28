import { combineQueryResults, type QueryState } from "utils/queries";

export const combineWithEpochId = <T>({
  epochId,
  query,
}: {
  epochId: QueryState<bigint>;
  query: QueryState<T>;
}) =>
  epochId.data === 0n
    ? {
        data: null,
        isError: false,
        isLoading: false,
        isPending: false,
      }
    : combineQueryResults({
        results: [epochId, query],
        select: ([, data]) => data,
      });
