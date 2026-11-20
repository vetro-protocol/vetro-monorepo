import { queryOptions } from "@tanstack/react-query";
import { fetchStakingVaultForPeggedToken } from "fetchers/fetchStakingVaultForPeggedToken";
import type { Address, Client } from "viem";

export const stakingVaultForPeggedTokenOptions = ({
  chainId,
  client,
  peggedTokenAddress,
}: {
  chainId: number | undefined;
  client: Client | undefined;
  peggedTokenAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: ({ client: queryClient }) =>
      fetchStakingVaultForPeggedToken({
        client: client!,
        peggedTokenAddress,
        queryClient,
      }),
    queryKey: ["staking-vault-for-pegged-token", chainId, peggedTokenAddress],
  });
