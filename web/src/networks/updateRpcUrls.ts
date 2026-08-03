import { type Chain, defineChain } from "viem";

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
