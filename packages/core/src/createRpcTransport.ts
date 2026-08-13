import { type Chain, fallback, http } from "viem";

/**
 * Build the transport for a chain from its configured RPC URLs: several URLs
 * become a viem `fallback` transport, so a failing or rate-limited endpoint
 * rolls over to the next one instead of degrading the app; a single URL becomes
 * a plain `http` transport.
 *
 * `http({ batch: true })` packs concurrent calls into one JSON-RPC request. It
 * pairs with the client-level `batch: { multicall: true }` — which aggregates
 * contract reads issued in the same tick into a single `eth_call` to Multicall3
 * — to collapse the many reads a page or endpoint makes into a handful of round
 * trips.
 */
export const createRpcTransport = function (chain: Chain) {
  const urls = chain.rpcUrls.default.http;
  return urls.length > 1
    ? fallback(urls.map((url) => http(url, { batch: true })))
    : http(urls[0], { batch: true });
};
