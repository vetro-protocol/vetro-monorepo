import { type Address, isAddress, isAddressEqual, zeroAddress } from "viem";

export const isAddressValid = (address: Address | undefined) =>
  !!address && isAddress(address) && !isAddressEqual(address, zeroAddress);
