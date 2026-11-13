import { type Hex } from "viem";

// Standard ERC-1967 storage slots (eip1967.proxy.implementation / .admin).
export const erc1967AdminSlot: Hex =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
export const erc1967ImplementationSlot: Hex =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
