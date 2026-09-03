import type { UseQueryResult } from "@tanstack/react-query";

type QueryState<T> = Pick<
  UseQueryResult<T>,
  "data" | "isError" | "isLoading" | "isPending"
>;

export function combineWithEpochId<T>({
  epochId,
  query,
}: {
  epochId: QueryState<bigint>;
  query: QueryState<T>;
}) {
  const isError = epochId.isError || query.isError;

  return {
    data: query.data,
    isError,
    isLoading: !isError && (epochId.isLoading || query.isLoading),
    isPending: !isError && (epochId.isPending || query.isPending),
  };
}
