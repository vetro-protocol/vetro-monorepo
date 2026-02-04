import type { Address, Client } from "viem";
import { balanceOf, convertToAssets } from "viem-erc4626/actions";

export async function fetchStakedBalance({
  account,
  client,
  stakingVaultAddress,
}: {
  account: Address;
  client: Client;
  stakingVaultAddress: Address;
}) {
  // Get user's shares (sVUSD balance)
  const shares = await balanceOf(client, {
    account,
    address: stakingVaultAddress,
  });

  // Convert shares to underlying assets (VUSD)
  return convertToAssets(client, {
    address: stakingVaultAddress,
    shares,
  });
}
