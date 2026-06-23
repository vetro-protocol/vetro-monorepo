import { type Chain, defineChain } from "viem";

const isValidUrl = function (url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

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
