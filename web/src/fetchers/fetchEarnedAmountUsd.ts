import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { costBasisQueryOptions } from "hooks/useCostBasis";
import { pricesOptions } from "hooks/usePrices";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import { tokenAmountToUsd } from "utils/currency";
import type { Address, Client } from "viem";

export const fetchEarnedAmountUsd = async function ({
  account,
  client,
  queryClient,
  stakingVaultAddress,
}: {
  account: Address;
  client: Client;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}): Promise<number> {
  const chainId = client.chain?.id;
  if (chainId === undefined) {
    throw new Error("Client is missing a chain");
  }

  const [costBases, peggedToken, prices, userShares, userStakedAssets] =
    await Promise.all([
      queryClient.ensureQueryData(costBasisQueryOptions({ address: account })),
      queryClient.ensureQueryData(
        vaultPeggedTokenQueryOptions({
          client,
          queryClient,
          stakingVaultAddress,
        }),
      ),
      queryClient.ensureQueryData(pricesOptions({ client, queryClient })),
      queryClient.ensureQueryData(
        tokenBalanceQueryOptions({
          account,
          client,
          token: { address: stakingVaultAddress, chainId },
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
    ]);

  if (userShares === 0n) {
    return 0;
  }

  const costBasis = costBases[stakingVaultAddress] ?? 0n;
  if (costBasis === 0n) {
    return 0;
  }

  return tokenAmountToUsd({
    amount: userStakedAssets - costBasis,
    prices,
    token: peggedToken,
  });
};
