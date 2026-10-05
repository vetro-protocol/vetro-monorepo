import { type QueryClient } from "@tanstack/react-query";

import { trackedTokensOptions } from "../hooks/useTrackedTokens";

import { fetchAssetsPerShare } from "./fetchAssetsPerShare";

export const fetchShareTokenRates = async function ({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  const tokens = await queryClient.ensureQueryData(trackedTokensOptions());

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
