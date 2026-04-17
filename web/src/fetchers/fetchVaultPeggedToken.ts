import type { QueryClient } from "@tanstack/react-query";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import type { Token } from "types";
import type { Address, Client } from "viem";
import { asset } from "viem-erc4626/actions";

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
  const address = await asset(client, { address: stakingVaultAddress });

  return queryClient.ensureQueryData(
    tokenInfoOptions({
      address,
      chainId: client.chain!.id,
      client,
    }),
  );
};
