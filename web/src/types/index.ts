import type { Address, Chain } from "viem";

export type Token = {
  address: Address;
  chainId: Chain["id"];
  decimals: number;
  symbol: string;
};
