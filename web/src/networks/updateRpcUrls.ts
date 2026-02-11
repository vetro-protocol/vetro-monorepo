import { isValidUrl } from "utils/url";
import { type Chain, defineChain } from "viem";

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
