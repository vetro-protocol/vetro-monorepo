import { type QueryClient } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";

import { shareTokenRatesOptions } from "../hooks/useShareTokenRates";
import { trackedTokensOptions } from "../hooks/useTrackedTokens";
import { type TrackedToken } from "../lib/types";

// Overridable per environment (see .env / .env.local), like web's VITE_PORTAL_API_URL.
const PORTAL_API_BASE = import.meta.env.VITE_PORTAL_API_URL;

type PortalPrices = Record<string, string>;

const fetchPortalPrices = () =>
  fetch(`${PORTAL_API_BASE}/prices`).then(
    (body) => (body as { prices: PortalPrices }).prices,
  );

// USD per peg unit, mirroring web's pegToUsdRate: "USD" is identity ($1), otherwise
// the portal spot price for the price symbol.
const pegToUsd = ({
  portal,
  priceSymbol,
}: {
  portal: PortalPrices;
  priceSymbol: string;
}) => (priceSymbol === "USD" ? 1 : Number(portal[priceSymbol] ?? 0));

const tokenUsdPrice = function ({
  portal,
  shareRates,
  token,
}: {
  portal: PortalPrices;
  shareRates: Partial<Record<string, number>>;
  token: TrackedToken;
}) {
  const baseUsd = pegToUsd({
    portal,
    priceSymbol: token.extensions?.priceSymbol ?? token.symbol,
  });
  if (!token.extensions?.isVaultShare) {
    return baseUsd;
  }
  const rate = shareRates[token.address.toLowerCase()];
  return rate === undefined ? undefined : baseUsd * rate;
};

// USD price per whole token, keyed by lowercased address — consumed by the Stats
// token-distribution. Reads portal spot prices + on-chain share values in-browser.
export const fetchTokenPrices = async function ({
  queryClient,
}: {
  queryClient: QueryClient;
}): Promise<Record<string, number>> {
  // fetchQuery rather than ensureQueryData: nothing observes share-token-rates on
  // the list page, so ensureQueryData would reuse rates past their staleTime.
  const [portal, tokens, shareRates] = await Promise.all([
    fetchPortalPrices(),
    queryClient.ensureQueryData(trackedTokensOptions()),
    queryClient.fetchQuery(shareTokenRatesOptions()),
  ]);

  return Object.fromEntries(
    tokens.flatMap(function (token) {
      const usd = tokenUsdPrice({ portal, shareRates, token });
      return usd === undefined
        ? []
        : [[token.address.toLowerCase(), usd] as const];
    }),
  );
};
