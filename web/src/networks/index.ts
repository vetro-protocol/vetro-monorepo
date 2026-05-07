import type { Chain } from "viem";
import { arbitrum, base, bsc, hemi, optimism } from "viem/chains";

import { mainnet } from "./mainnet";

export const allChains = [
  mainnet,
  hemi,
  arbitrum,
  base,
  optimism,
  bsc,
] as const;

export const getChainById = function (chainId: Chain["id"]) {
  const chain = allChains.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(`Chain with id ${chainId} not found`);
  }
  return chain;
};
