import { createPublicClient, fallback, http } from "viem";
import { mainnet as mainnetDefinition } from "viem/chains";

import { updateRpcUrls } from "./updateRpcUrls";

// Shared mainnet public client for the browser-side on-chain reads (Sushi pool
// liquidity, tracked-token discovery, share values). Keyless, CORS-enabled public
// RPC — never the API's secret RPC, which would leak into the bundle. The RPC
// origin is env-driven (VITE_RPC_URL_MAINNET; a single URL or several joined by
// "+") and must be whitelisted in the worker CSP connect-src (src/index.ts).
const mainnet = updateRpcUrls(
  mainnetDefinition,
  import.meta.env.VITE_RPC_URL_MAINNET,
);

const urls = mainnet.rpcUrls.default.http;
const transport =
  urls.length > 1 ? fallback(urls.map((url) => http(url))) : http(urls[0]);

export const client = createPublicClient({
  // Coalesce concurrent contract reads (e.g. the per-pool balanceOf reads and
  // token-info lookups) into a single Multicall3 call instead of one RPC
  // round-trip each.
  batch: { multicall: true },
  chain: mainnet,
  transport,
});
