import type { QueryClient } from "@tanstack/react-query";
import { peggedTokensByGatewayQueryOptions } from "hooks/usePeggedTokensByGateway";
import { pricesOptions } from "hooks/usePrices";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import { getTokenPrice } from "utils/token";
import { type Address, type Client, formatUnits } from "viem";

export const fetchTotalStakedUsd = async function ({
  account,
  client,
  queryClient,
  stakingVaultAddresses,
}: {
  account: Address;
  client: Client;
  queryClient: QueryClient;
  stakingVaultAddresses: readonly Address[];
}): Promise<number> {
  const chainId = client.chain?.id;
  if (chainId === undefined) {
    throw new Error("Client is missing a chain");
  }

  // peggedTokensByGateway is indexed by gateway address; we only have the pegged
  // token here, so reverse the index to look up gateway by pegged-token address.
  // Kick off the fetch now (without awaiting) so it overlaps with the per-vault
  // pegged-token fetch below.
  const gatewayByPeggedTokenPromise = queryClient
    .ensureQueryData(peggedTokensByGatewayQueryOptions({ client, queryClient }))
    .then((peggedTokensByGateway) =>
      Object.fromEntries(
        Object.values(peggedTokensByGateway).map((token) => [
          token.address,
          token.gatewayAddress,
        ]),
      ),
    );

  const perVaultUsd = await Promise.all(
    stakingVaultAddresses.map(async function (stakingVaultAddress) {
      const [peggedToken, gatewayByPeggedToken] = await Promise.all([
        queryClient.ensureQueryData(
          vaultPeggedTokenQueryOptions({
            client,
            queryClient,
            stakingVaultAddress,
          }),
        ),
        gatewayByPeggedTokenPromise,
      ]);
      const gatewayAddress = gatewayByPeggedToken[peggedToken.address];
      if (!gatewayAddress) {
        throw new Error(
          `No gateway found for pegged token ${peggedToken.address}`,
        );
      }

      const [stakedAssets, prices] = await Promise.all([
        queryClient.ensureQueryData(
          stakedBalanceQueryOptions({
            account,
            chainId,
            client,
            queryClient,
            stakingVaultAddress,
          }),
        ),
        queryClient.ensureQueryData(
          pricesOptions({ client, gatewayAddress, queryClient }),
        ),
      ]);

      const amount = Number(formatUnits(stakedAssets, peggedToken.decimals));
      const price = Number(getTokenPrice(peggedToken, prices));
      return amount * price;
    }),
  );

  return perVaultUsd.reduce((sum, value) => sum + value, 0);
};
