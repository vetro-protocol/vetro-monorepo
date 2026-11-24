import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVaultPeggedToken } from "fetchers/fetchVaultPeggedToken";
import { graphVaultPeggedToken } from "utils/protocolGraph";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

const vaultPeggedTokenQueryKey = ({
  chainId,
  stakingVaultAddress,
}: {
  chainId: number | undefined;
  stakingVaultAddress: Address;
}) => ["vault-pegged-token", chainId, stakingVaultAddress];

export const vaultPeggedTokenQueryOptions = ({
  client,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    placeholderData: graphVaultPeggedToken(stakingVaultAddress),
    queryFn: ({ client: queryClient }) =>
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
  return useQuery(
    vaultPeggedTokenQueryOptions({
      client,
      stakingVaultAddress,
    }),
  );
};
