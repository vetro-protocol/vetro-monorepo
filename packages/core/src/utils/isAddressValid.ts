import { type Address, isAddress, isAddressEqual, zeroAddress } from "viem";

/**
 * Narrows to `Address`, rejecting the zero address along with the missing and
 * malformed ones: contracts return `0x0…0` for an unset address, so a
 * well-formed result is not necessarily a usable one.
 */
export const isAddressValid = (
  address: Address | undefined,
): address is Address =>
  !!address && isAddress(address) && !isAddressEqual(address, zeroAddress);
