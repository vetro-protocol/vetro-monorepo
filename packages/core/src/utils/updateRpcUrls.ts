import { type Chain, defineChain } from "viem";

/**
 * Override a chain's default RPC URLs from an env var holding a single URL, or
 * several joined by "+". Invalid entries are dropped; if none are left, the
 * chain is returned untouched.
 */
export const updateRpcUrls = function (chain: Chain, rpcUrlEnv?: string) {
  if (typeof rpcUrlEnv !== "string") {
    return chain;
  }
  const urls = rpcUrlEnv.split("+").filter((url) => URL.canParse(url));
  if (urls.length > 0) {
    return defineChain({
      ...chain,
      rpcUrls: {
        default: {
          http: urls,
        },
      },
    });
  }
  return chain;
};
