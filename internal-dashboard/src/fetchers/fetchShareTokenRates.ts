import { type QueryClient } from "@tanstack/react-query";

import { trackedTokensOptions } from "../hooks/useTrackedTokens";

import { fetchAssetsPerShare } from "./fetchAssetsPerShare";

// Underlying assets per whole share of each tracked vault share token, keyed by
// lowercased address.
export const fetchShareTokenRates = async function ({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  const tokens = await queryClient.ensureQueryData(trackedTokensOptions());

  // Read each vault independently: one reverting vault shouldn't drop the rest.
  const entries = await Promise.all(
    tokens
      .filter((token) => token.extensions?.isVaultShare)
      .map(async function (token) {
        try {
          const rate = await fetchAssetsPerShare({ queryClient, token });
          return [token.address.toLowerCase(), rate] as const;
        } catch {
          return undefined;
        }
      }),
  );
  return Object.fromEntries(entries.filter(Boolean));
};
