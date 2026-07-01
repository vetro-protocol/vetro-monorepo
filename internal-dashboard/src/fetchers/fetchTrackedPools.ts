import { type QueryClient } from "@tanstack/react-query";

import { trackedTokensOptions } from "../hooks/useTrackedTokens";
import { type TrackedPool } from "../lib/types";

import { fetchCurvePools } from "./fetchCurvePools";

export const fetchTrackedPools = async function (
  queryClient: QueryClient,
): Promise<TrackedPool[]> {
  const tokens = await queryClient.ensureQueryData(trackedTokensOptions());
  const trackedAddresses = new Set(
    tokens.map((token) => token.address.toLowerCase()),
  );

  // Keep the rest of the list alive when a single source fails (Sushi is added
  // in a later PR). Only surface an error when every source fails, so a real
  // outage isn't silently shown as an empty pool list.
  const results = await Promise.allSettled([
    fetchCurvePools(trackedAddresses),
    // Adding Sushi Pools in next PR here
  ]);

  const fulfilled = results.filter(
    (result): result is PromiseFulfilledResult<TrackedPool[]> =>
      result.status === "fulfilled",
  );
  if (fulfilled.length === 0) {
    throw (results[0] as PromiseRejectedResult).reason;
  }

  return fulfilled.flatMap((result) => result.value);
};
