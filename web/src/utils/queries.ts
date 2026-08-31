import type { UseQueryResult } from "@tanstack/react-query";

export const sumUsdResults = (results: UseQueryResult<number>[]) => ({
  data: results.every((result) => result.data !== undefined)
    ? results.reduce((total, result) => total + result.data!, 0)
    : undefined,
  isError: results.some((result) => result.isError),
  isLoading: results.some((result) => result.isLoading),
});
