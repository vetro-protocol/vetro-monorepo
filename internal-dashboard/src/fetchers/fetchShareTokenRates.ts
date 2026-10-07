import { type QueryClient } from "@tanstack/react-query";

import { trackedTokensOptions } from "../hooks/useTrackedTokens";
import { tokenAddresses } from "../lib/tokenAddresses";

import { fetchAssetsPerShare } from "./fetchAssetsPerShare";

export const fetchShareTokenRates = async function ({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  const tokens = await queryClient.ensureQueryData(trackedTokensOptions());

  const vaults = await Promise.all(
    tokens
      .filter((token) => token.extensions?.isVaultShare)
      .map(async function (token) {
        try {
          const rate = await fetchAssetsPerShare({ token });
          return [{ rate, token }];
        } catch {
          return [];
        }
      }),
  );

  const rated = vaults.flat();
  // Vaults may share a symbol (e.g. a v1 and a v2), so key each vault's own
  // address first and never let a same-symbol bridged address replace it.
  const rates: Record<string, number> = Object.fromEntries(
    rated.map(({ rate, token }) => [token.address.toLowerCase(), rate]),
  );
  rated.forEach(function ({ rate, token }) {
    tokenAddresses(token).forEach(function (address) {
      rates[address.toLowerCase()] ??= rate;
    });
  });
  return rates;
};
