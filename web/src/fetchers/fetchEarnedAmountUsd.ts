import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { averagePurchasePriceQueryOptions } from "hooks/useAveragePurchasePrice";
import { pricesOptions } from "hooks/usePrices";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import { tokenAmountToUsd } from "utils/currency";
import type { Address, Client } from "viem";

const WAD = 10n ** 18n;

export const fetchEarnedAmountUsd = async function ({
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

  const [prices, averagePurchasePrices] = await Promise.all([
    queryClient.ensureQueryData(pricesOptions({ client, queryClient })),
    queryClient.ensureQueryData(
      averagePurchasePriceQueryOptions({ address: account }),
    ),
  ]);

  const perVaultUsd = await Promise.all(
    stakingVaultAddresses.map(async function (stakingVaultAddress) {
      const [peggedToken, userStakedAssets, userShares] = await Promise.all([
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
        queryClient.ensureQueryData(
          tokenBalanceQueryOptions({
            account,
            client,
            token: { address: stakingVaultAddress, chainId },
          }),
        ),
      ]);

      if (userShares === 0n) {
        return 0;
      }

      const averagePrice = averagePurchasePrices[stakingVaultAddress] ?? 0n;
      if (averagePrice === 0n) {
        return 0;
      }

      const costBasisAssets = (userShares * averagePrice) / WAD;
      const earnedAssets = userStakedAssets - costBasisAssets;
      return tokenAmountToUsd({
        amount: earnedAssets,
        prices,
        token: peggedToken,
      });
    }),
  );

  return perVaultUsd.reduce((sum, value) => sum + value, 0);
};
