import type { QueryClient } from "@tanstack/react-query";
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

  const pricesPromise = queryClient.ensureQueryData(
    pricesOptions({ client, queryClient }),
  );

  const perVaultUsd = await Promise.all(
    stakingVaultAddresses.map(async function (stakingVaultAddress) {
      const [peggedToken, stakedAssets, prices] = await Promise.all([
        queryClient.ensureQueryData(
          vaultPeggedTokenQueryOptions({
            client,
            queryClient,
            stakingVaultAddress,
          }),
        ),
        queryClient.ensureQueryData(
          stakedBalanceQueryOptions({
            account,
            chainId,
            client,
            queryClient,
            stakingVaultAddress,
          }),
        ),
        pricesPromise,
      ]);

      const amount = Number(formatUnits(stakedAssets, peggedToken.decimals));
      const price = Number(getTokenPrice(peggedToken, prices));
      return amount * price;
    }),
  );

  return perVaultUsd.reduce((sum, value) => sum + value, 0);
};
