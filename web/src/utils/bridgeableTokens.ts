import type { Address, Chain } from "viem";
import { arbitrum, base, bsc, hemi, mainnet, optimism } from "viem/chains";

type BridgeTokenChainEntry = {
  address: Address;
  chainId: Chain["id"];
  oftAdapterAddress?: Address;
};

export const bridgeableTokens: BridgeTokenChainEntry[] = [
  // VUSD
  {
    address: "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
    chainId: mainnet.id,
    oftAdapterAddress: "0xFc8Acf5ef1E8839Ec94151740CfEd95D7E579Afb",
  },
  {
    address: "0xD3599AE62EE280709A22268a46d23164214e345B",
    chainId: hemi.id,
  },
  {
    address: "0xCE2c108fB49551f6d27BBb529Ad1938835ac3574",
    chainId: arbitrum.id,
  },
  {
    address: "0x8a654093e21703afc8d038FF253A3c974C5C2957",
    chainId: base.id,
  },
  {
    address: "0x10061d0593441Ff74536158592e1Be3F4C7B180C",
    chainId: bsc.id,
  },
  {
    address: "0xb591169E6508983CC6618738cC73c9F09c38dE14",
    chainId: optimism.id,
  },
];
