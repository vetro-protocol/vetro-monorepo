import { type Address, zeroAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";

const GATEWAY_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: zeroAddress,
  [sepolia.id]: zeroAddress,
};

export function getGatewayAddress(chainId: number): Address {
  const address = GATEWAY_ADDRESSES[chainId];

  if (!address) {
    throw new Error(`Gateway address not configured for chain ID: ${chainId}`);
  }

  return address;
}
