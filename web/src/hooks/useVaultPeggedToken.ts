import {
  QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchVaultPeggedToken } from "fetchers/fetchVaultPeggedToken";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

const vaultPeggedTokenQueryKey = ({
  chainId,
  stakingVaultAddress,
}: {
  chainId: number | undefined;
  stakingVaultAddress: Address;
}) => ["vault-pegged-token", chainId, stakingVaultAddress];

const vaultPeggedTokenQueryOptions = ({
  client,
  queryClient,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchVaultPeggedToken({
        client: client!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: vaultPeggedTokenQueryKey({
      chainId: client?.chain?.id,
      stakingVaultAddress,
    }),
  });

export const useVaultPeggedToken = function (stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();
  return useQuery(
    vaultPeggedTokenQueryOptions({
      client,
      queryClient,
      stakingVaultAddress,
    }),
  );
};
