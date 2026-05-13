import { sVusdAddress } from "@vetro-protocol/earn";
import type { Address, Chain } from "viem";
import { arbitrum, base, bsc, hemi, mainnet, optimism } from "viem/chains";

type BridgeTokenChainEntry = {
  address: Address;
  chainId: Chain["id"];
  oftAdapterAddress?: Address;
  sharedDecimals: number;
};

export const bridgeableTokens: BridgeTokenChainEntry[] = [
  // VUSD
  {
    address: "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
    chainId: mainnet.id,
    oftAdapterAddress: "0xFc8Acf5ef1E8839Ec94151740CfEd95D7E579Afb",
    sharedDecimals: 6,
  },
  {
    address: "0xD3599AE62EE280709A22268a46d23164214e345B",
    chainId: hemi.id,
    sharedDecimals: 6,
  },
  {
    address: "0xCE2c108fB49551f6d27BBb529Ad1938835ac3574",
    chainId: arbitrum.id,
    sharedDecimals: 6,
  },
  {
    address: "0x8a654093e21703afc8d038FF253A3c974C5C2957",
    chainId: base.id,
    sharedDecimals: 6,
  },
  {
    address: "0x10061d0593441Ff74536158592e1Be3F4C7B180C",
    chainId: bsc.id,
    sharedDecimals: 6,
  },
  {
    address: "0xb591169E6508983CC6618738cC73c9F09c38dE14",
    chainId: optimism.id,
    sharedDecimals: 6,
  },
  // sVUSD
  {
    address: sVusdAddress,
    chainId: mainnet.id,
    oftAdapterAddress: "0x968563eeD04e0289ccC79d7029bFc79F040605f0",
    sharedDecimals: 6,
  },
  {
    address: "0xfe875CC86cC6BC2E93ab330D6b2c408C3Cd79710",
    chainId: hemi.id,
    sharedDecimals: 6,
  },
  {
    address: "0x50c580227764b621c0433bB6Ab756C781c495ce7",
    chainId: arbitrum.id,
    sharedDecimals: 6,
  },
  {
    address: "0xb174750002068862Dfe7DF38F974a950F189386a",
    chainId: base.id,
    sharedDecimals: 6,
  },
  {
    address: "0xC141B66eE4262Ba46Ea29578955C274fD4A96515",
    chainId: bsc.id,
    sharedDecimals: 6,
  },
  {
    address: "0x92273Ca3356379C2fe870FE3805cc5e7aB6d19c6",
    chainId: optimism.id,
    sharedDecimals: 6,
  },
];
