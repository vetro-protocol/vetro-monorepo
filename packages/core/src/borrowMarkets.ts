import type { Address, Hash } from "viem";

// Same value as getChainAddresses(mainnet.id).blue from @morpho-org/blue-sdk.
export const morphoBlueAddress: Address =
  "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

export const marketIds: Hash[] = [
  // hemiBTC / VUSD
  "0x55609be688a4d96e715bfe39969133bd4e7f83db4f77bb06216109189a11f2e5",
  // WETH / VUSD
  "0x7d1306d23f9f1e419697b8275001db9ea74b3c75190a7db8f5d81fed2fb94561",
];
