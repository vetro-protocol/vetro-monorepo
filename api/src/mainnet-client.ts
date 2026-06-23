import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

import { updateRpcUrls } from "./update-rpc-urls.ts";

/**
 * Create a viem public client for Ethereum mainnet from the given RPC URL
 * config. `rpcUrl` may hold a single URL or several joined by "+", matching the
 * portal/web convention; multiple URLs become a viem `fallback` transport, one
 * becomes a plain `http` transport, and none falls back to the chain's default
 * RPC.
 *
 * `batch.multicall` aggregates contract reads issued in the same tick into a
 * single `eth_call` to Multicall3, and `http({ batch: true })` packs any
 * remaining concurrent calls into one JSON-RPC request. Together they collapse
 * the many reads each analytics endpoint makes into a handful of round trips.
 */
export const createMainnetClient = function (rpcUrl: string | undefined) {
  const chain = updateRpcUrls(mainnet, rpcUrl);
  const urls = chain.rpcUrls.default.http;
  const transport =
    urls.length > 1
      ? fallback(urls.map((url) => http(url, { batch: true })))
      : http(urls[0], { batch: true });
  return createPublicClient({
    batch: { multicall: true },
    chain,
    transport,
  });
};
