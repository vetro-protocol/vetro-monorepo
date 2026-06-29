import { type QueryClient } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { asset, convertToAssets } from "viem-erc4626/actions";

import { tokenInfoOptions } from "../hooks/useTokenInfo";
import { trackedTokensOptions } from "../hooks/useTrackedTokens";
import { client } from "../lib/client";
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

const tokenUsdPrice = async function ({
  portal,
  queryClient,
  token,
}: {
  portal: PortalPrices;
  queryClient: QueryClient;
  token: TrackedToken;
}) {
  const baseUsd = pegToUsd({
    portal,
    priceSymbol: token.extensions?.priceSymbol ?? token.symbol,
  });
  if (!token.extensions?.isVaultShare) {
    return baseUsd;
  }
  // Share token: convert one whole share to underlying assets on-chain, then
  // price. The underlying's decimals are read on demand (cached) rather than
  // stored on the token.
  const assetAddress = await asset(client, { address: token.address });
  const { decimals: assetDecimals } = await queryClient.ensureQueryData(
    tokenInfoOptions(assetAddress),
  );
  const assetsRaw = await convertToAssets(client, {
    address: token.address,
    shares: 10n ** BigInt(token.decimals),
  });
  const assetsPerShare = Number(assetsRaw) / 10 ** assetDecimals;
  return baseUsd * assetsPerShare;
};

// USD price per whole token, keyed by lowercased address — consumed by the Stats
// token-distribution. Reads portal spot prices + on-chain share values in-browser.
export const fetchTokenPrices = async function ({
  queryClient,
}: {
  queryClient: QueryClient;
}): Promise<Record<string, number>> {
  const [portal, tokens] = await Promise.all([
    fetchPortalPrices(),
    queryClient.ensureQueryData(trackedTokensOptions()),
  ]);

  const entries = await Promise.all(
    tokens.map(async function (token) {
      const usd = await tokenUsdPrice({ portal, queryClient, token });
      return [token.address.toLowerCase(), usd] as const;
    }),
  );
  return Object.fromEntries(entries);
};
