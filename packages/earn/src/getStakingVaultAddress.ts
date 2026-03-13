import { type Address, zeroAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";

const STAKING_VAULT_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: "0x476310E34D2810f7d79C43A74E4D79405bd7a925",
  [sepolia.id]: zeroAddress,
};

export function getStakingVaultAddress(chainId: number): Address {
  const address = STAKING_VAULT_ADDRESSES[chainId];

  if (!address) {
    throw new Error(
      `StakingVault address not configured for chain ID: ${chainId}`,
    );
  }

  return address;
}
