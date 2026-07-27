import { type Address, type Hex } from "viem";

// The Hemi Earn agent — executor contract on Ethereum that processes
// cross-chain deposit/redeem requests bridged from Hemi, staking into and
// redeeming from the Vetro Earn vaults. Everything else about it (keepers,
// owner, implementation, proxy admin) is read live from the chain.
export const earnAgentAddress: Address =
  "0xFd07A07505F73C63A6F8FF03B7474a90C0B3c5Ce";

export const earnAgentAbi = [
  {
    inputs: [],
    name: "getKeepers",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Standard ERC-1967 storage slots (eip1967.proxy.implementation / .admin).
export const erc1967AdminSlot: Hex =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
export const erc1967ImplementationSlot: Hex =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
