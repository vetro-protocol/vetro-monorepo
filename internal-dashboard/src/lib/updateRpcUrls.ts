import { type Chain, defineChain } from "viem";

const isValidUrl = function (url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Override a chain's default RPC URLs from an env var, matching the web/api
// convention: a single URL, or several joined by "+". Invalid entries are
// dropped, and an empty/undefined value leaves the chain untouched.
export const updateRpcUrls = function (chain: Chain, rpcUrlEnv?: string) {
  if (typeof rpcUrlEnv !== "string") {
    return chain;
  }
  const urls = rpcUrlEnv.split("+").filter(isValidUrl);
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
