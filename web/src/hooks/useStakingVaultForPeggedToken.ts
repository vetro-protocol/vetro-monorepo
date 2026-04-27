import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { fetchStakingVaultForPeggedToken } from "fetchers/fetchStakingVaultForPeggedToken";
import type { Address, Client } from "viem";

export const stakingVaultForPeggedTokenOptions = ({
  chainId,
  client,
  peggedTokenAddress,
  queryClient,
}: {
  chainId: number | undefined;
  client: Client | undefined;
  peggedTokenAddress: Address;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchStakingVaultForPeggedToken({
        client: client!,
        peggedTokenAddress,
        queryClient,
      }),
    queryKey: ["staking-vault-for-pegged-token", chainId, peggedTokenAddress],
  });
