import type { QueryClient } from "@tanstack/react-query";
import { peggedTokensByGatewayQueryOptions } from "hooks/usePeggedTokensByGateway";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import { vaultAssetOptions } from "hooks/useVaultAsset";
import type { TokenWithGateway } from "types";
import { type Address, type Client, isAddressEqual } from "viem";

export const fetchVaultPeggedToken = async function ({
  client,
  queryClient,
  stakingVaultAddress,
}: {
  client: Client;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}): Promise<TokenWithGateway> {
  const address = await queryClient.ensureQueryData(
    vaultAssetOptions({ client, vaultAddress: stakingVaultAddress }),
  );

  const [token, peggedTokensByGateway] = await Promise.all([
    queryClient.ensureQueryData(
      tokenInfoOptions({
        address,
        chainId: client.chain!.id,
        client,
      }),
    ),
    queryClient.ensureQueryData(
      peggedTokensByGatewayQueryOptions({ client, queryClient }),
    ),
  ]);

  const match = Object.values(peggedTokensByGateway).find((t) =>
    isAddressEqual(t.address, address),
  );
  if (!match) {
    throw new Error(
      `No gateway found for pegged token ${address} of vault ${stakingVaultAddress}`,
    );
  }

  return { ...token, gatewayAddress: match.gatewayAddress };
};
