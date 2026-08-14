import { type Chain, defineChain } from "viem";

// Only use http(s) endpoints as an RPC transport, so match the scheme rather
// than parsing with `URL`, which also accepts ftp://, wss:// and "foo:bar".
const httpUrlPattern = /^https?:\/\/\S+$/;

/**
 * Override a chain's default RPC URLs from an env var holding a single URL, or
 * several joined by "+". Entries that are not http(s) URLs are dropped; if none
 * are left, the chain is returned untouched.
 */
export const updateRpcUrls = function (chain: Chain, rpcUrlEnv?: string) {
  if (typeof rpcUrlEnv !== "string") {
    return chain;
  }
  const urls = rpcUrlEnv.split("+").filter((url) => httpUrlPattern.test(url));
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
