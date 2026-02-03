import { type Address, zeroAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";

const STAKING_VAULT_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: zeroAddress,
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
