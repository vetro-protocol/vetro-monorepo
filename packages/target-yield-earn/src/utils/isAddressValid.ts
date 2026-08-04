import { type Address, isAddress, isAddressEqual, zeroAddress } from "viem";

export const isAddressValid = (
  address: Address | undefined,
): address is Address =>
  !!address && isAddress(address) && !isAddressEqual(address, zeroAddress);
