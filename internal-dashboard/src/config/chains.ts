import { hemi, mainnet } from "viem/chains";

export const trackedChains = [mainnet, hemi] as const;

export type TrackedChainId = (typeof trackedChains)[number]["id"];

export const getTrackedChain = (chainId: number) =>
  trackedChains.find((chain) => chain.id === chainId);
