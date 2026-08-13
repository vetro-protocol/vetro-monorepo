import { createMainnetClient } from "@vetro-protocol/core";

// Shared mainnet public client for the browser-side on-chain reads (Sushi pool
// liquidity, tracked-token discovery, share values). Keyless, CORS-enabled public
// RPC — never the API's secret RPC, which would leak into the bundle. The RPC
// origin is env-driven (VITE_RPC_URL_MAINNET; a single URL or several joined by
// "+") and must be whitelisted in the worker CSP connect-src (src/index.ts).
export const client = createMainnetClient(import.meta.env.VITE_RPC_URL_MAINNET);
