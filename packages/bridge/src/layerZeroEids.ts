import { arbitrum, base, bsc, hemi, mainnet, optimism } from "viem/chains";

export const layerZeroEids: Record<number, number> = {
  [arbitrum.id]: 30110,
  [base.id]: 30184,
  [bsc.id]: 30102,
  [hemi.id]: 30329,
  [mainnet.id]: 30101,
  [optimism.id]: 30111,
};

export const getLayerZeroEid = function (chainId: number): number {
  const eid = layerZeroEids[chainId];
  if (eid === undefined) {
    throw new Error(`No LayerZero EID registered for chainId ${chainId}`);
  }
  return eid;
};
