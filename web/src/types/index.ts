import type { Address, Chain } from "viem";

export type Token = {
  address: Address;
  chainId: Chain["id"];
  decimals: number;
  extensions?: {
    allowanceSlot?: bigint;
  };
  logoURI: string;
  name: string;
  symbol: string;
};
