import { type Address, zeroAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";

const GATEWAY_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F",
  [sepolia.id]: zeroAddress,
};

export function getGatewayAddress(chainId: number): Address {
  const address = GATEWAY_ADDRESSES[chainId];

  if (!address) {
    throw new Error(`Gateway address not configured for chain ID: ${chainId}`);
  }

  return address;
}
