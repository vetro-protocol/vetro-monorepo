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

  // Keep the rest of the list (Curve) alive if the other fails
  const sources = await Promise.all([
    fetchCurvePools(trackedAddresses).catch(() => []),
    // Adding Sushi Pools in next PR here
  ]);
  return sources.flat();
};
