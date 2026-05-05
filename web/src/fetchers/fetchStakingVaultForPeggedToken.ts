import type { QueryClient } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { vaultAssetOptions } from "hooks/useVaultAsset";
import { type Address, type Client, isAddressEqual } from "viem";

export const fetchStakingVaultForPeggedToken = async function ({
  client,
  peggedTokenAddress,
  queryClient,
}: {
  client: Client;
  peggedTokenAddress: Address;
  queryClient: QueryClient;
}) {
  const assets = await Promise.all(
    stakingVaultAddresses.map((vaultAddress) =>
      queryClient.ensureQueryData(vaultAssetOptions({ client, vaultAddress })),
    ),
  );
  const stakingVaultAddress = stakingVaultAddresses.find((_, index) =>
    isAddressEqual(assets[index], peggedTokenAddress),
  );
  if (!stakingVaultAddress) {
    throw new Error(
      `No staking vault found for pegged token ${peggedTokenAddress}`,
    );
  }
  return stakingVaultAddress;
};
