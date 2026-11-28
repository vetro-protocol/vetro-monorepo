import { type Address, padHex } from "viem";

export const addressToBytes32 = (address: Address) =>
  padHex(address, { size: 32 });
