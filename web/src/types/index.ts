import type { Address, Chain } from "viem";

export type Token = {
  address: Address;
  chainId: Chain["id"];
  decimals: number;
  extensions?: {
    allowanceSlot?: bigint;
    // Use this to map which symbol should be used to map prices
    priceSymbol?: string;
  };
  logoURI: string;
  name: string;
  symbol: string;
};
