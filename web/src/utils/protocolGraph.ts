import { gateways, knownTokens } from "@vetro-protocol/core";
import type { TokenWithGateway } from "types";
import { type Address, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

const graphFor = (gatewayAddress: Address) =>
  gateways.find((gateway) => isAddressEqual(gateway.address, gatewayAddress));

const knownToken = (address: Address) =>
  knownTokens.find(
    (token) =>
      token.chainId === mainnet.id && isAddressEqual(token.address, address),
  );

const withGateway = function ({
  address,
  gatewayAddress,
}: {
  address: Address;
  gatewayAddress: Address;
}): TokenWithGateway | undefined {
  const token = knownToken(address);
  return token ? { ...token, gatewayAddress } : undefined;
};

export const graphPeggedToken = function (gatewayAddress: Address) {
  const peggedToken = graphFor(gatewayAddress)?.peggedToken;
  return peggedToken
    ? withGateway({ address: peggedToken, gatewayAddress })
    : undefined;
};

export const graphWhitelistedTokens = function (gatewayAddress: Address) {
  const graph = graphFor(gatewayAddress);
  if (!graph) {
    return undefined;
  }
  const tokens = graph.whitelistedTokens.map((address) =>
    withGateway({ address, gatewayAddress }),
  );
  // One unknown token would render the selector with a nameless entry, so the
  // whole list falls back to the chain instead.
  return tokens.every((token) => token !== undefined) ? tokens : undefined;
};

const graphForVault = (stakingVaultAddress: Address) =>
  gateways.find(
    (gateway) =>
      gateway.stakingVault !== undefined &&
      isAddressEqual(gateway.stakingVault, stakingVaultAddress),
  );

export const graphShareToken = function (peggedTokenAddress: Address) {
  const gateway = gateways.find((candidate) =>
    isAddressEqual(candidate.peggedToken, peggedTokenAddress),
  );
  return gateway?.stakingVault ? knownToken(gateway.stakingVault) : undefined;
};

export const graphVaultPeggedToken = function (stakingVaultAddress: Address) {
  const gateway = graphForVault(stakingVaultAddress);
  return gateway
    ? withGateway({
        address: gateway.peggedToken,
        gatewayAddress: gateway.address,
      })
    : undefined;
};
