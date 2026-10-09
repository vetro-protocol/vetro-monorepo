import type { UseQueryResult } from "@tanstack/react-query";

type QueryState<T = unknown> = Pick<
  UseQueryResult<T>,
  "data" | "isError" | "isLoading" | "isPending"
>;

type QueriesData<Results extends readonly QueryState[]> = {
  -readonly [K in keyof Results]: Exclude<Results[K]["data"], undefined>;
};

export const combineQueryResults = <
  const Results extends readonly QueryState[],
  T,
>({
  results,
  select,
}: {
  results: Results;
  select: (data: QueriesData<Results>) => T;
}) => ({
  data: results.every((result) => result.data !== undefined)
    ? select(results.map((result) => result.data) as QueriesData<Results>)
    : undefined,
  isError: results.some((result) => result.isError),
  isLoading: results.some((result) => result.isLoading),
  isPending: results.some((result) => result.isPending),
});

export const sumUsdResults = (results: UseQueryResult<number>[]) =>
  combineQueryResults({
    results,
    select: (data) => data.reduce((total, value) => total + value, 0),
  });
