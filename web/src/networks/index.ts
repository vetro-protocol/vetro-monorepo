import { hemi, hemiSepolia } from "hemi-viem";
import type { Chain } from "viem";
import { arbitrum, base, bsc, optimism } from "viem/chains";

import { mainnet } from "./mainnet";

const isProduction = import.meta.env.VITE_DEPLOY_ENV === "production";

export const veVetroChain = isProduction ? hemi : hemiSepolia;

export const allChains = [
  mainnet,
  hemi,
  arbitrum,
  base,
  optimism,
  bsc,
  ...(isProduction ? [] : [hemiSepolia]),
] as const;

export const getChainById = function (chainId: Chain["id"]) {
  const chain = allChains.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(`Chain with id ${chainId} not found`);
  }
  return chain;
};
