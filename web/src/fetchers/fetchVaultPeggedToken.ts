import type { QueryClient } from "@tanstack/react-query";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import { vaultAssetOptions } from "hooks/useVaultAsset";
import type { Token } from "types";
import type { Address, Client } from "viem";

export const fetchVaultPeggedToken = async function ({
  client,
  queryClient,
  stakingVaultAddress,
}: {
  client: Client;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}): Promise<Token> {
  // The Asset of the vault is the pegged token,
  // as the vaults we use are for depositing pegged Tokens.
  const address = await queryClient.ensureQueryData(
    vaultAssetOptions({ client, vaultAddress: stakingVaultAddress }),
  );

  return queryClient.ensureQueryData(
    tokenInfoOptions({
      address,
      chainId: client.chain!.id,
      client,
    }),
  );
};
