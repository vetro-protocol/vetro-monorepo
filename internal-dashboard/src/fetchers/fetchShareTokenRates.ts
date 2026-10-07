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

  const rated = await Promise.all(
    tokens
      .filter((token) => token.extensions?.isVaultShare)
      .map(async (token) => ({
        rate: await fetchAssetsPerShare({ token }),
        token,
      })),
  );

  // Vaults may share a symbol (e.g. a v1 and a v2), so key each vault's own
  // address first and never let a same-symbol bridged address replace it.
  const rates: Partial<Record<string, number>> = Object.fromEntries(
    rated.map(({ rate, token }) => [token.address.toLowerCase(), rate]),
  );
  rated.forEach(function ({ rate, token }) {
    tokenAddresses(token).forEach(function (address) {
      rates[address.toLowerCase()] ??= rate;
    });
  });
  return rates;
};
