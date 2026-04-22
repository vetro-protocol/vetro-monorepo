import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { type Address, type PublicClient } from "viem";
import { asset } from "viem-erc4626/actions";

/**
 * Find the staking vault whose underlying asset matches the given pegged
 * token. Throws if none of the known vaults hold that asset.
 */
export async function findStakingVaultForPeggedToken({
  client,
  peggedTokenAddress,
}: {
  client: PublicClient;
  peggedTokenAddress: Address;
}) {
  const assets = await Promise.all(
    stakingVaultAddresses.map((address) => asset(client, { address })),
  );
  const stakingVaultAddress = stakingVaultAddresses.find(
    (_, index) =>
      assets[index].toLowerCase() === peggedTokenAddress.toLowerCase(),
  );
  if (!stakingVaultAddress) {
    throw new Error(
      `No staking vault found for pegged token ${peggedTokenAddress}`,
    );
  }
  return stakingVaultAddress;
}
