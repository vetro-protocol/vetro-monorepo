import { type Address, type Hex, padHex } from "viem";

export const addressToBytes32 = (address: Address): Hex =>
  padHex(address, { size: 32 });
