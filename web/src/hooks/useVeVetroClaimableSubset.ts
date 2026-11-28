import { queryOptions } from "@tanstack/react-query";
import { fetchVeVetroClaimableSubset } from "fetchers/fetchVeVetroClaimableSubset";
import type { Address, Client } from "viem";

export const veVetroClaimableSubsetQueryKey = (
  account: Address | undefined,
) => ["ve-vetro-claimable-subset", account];

export const veVetroClaimableSubsetOptions = ({
  account,
  client,
}: {
  account: Address | undefined;
  client: Client | undefined;
}) =>
  queryOptions({
    enabled: !!account && !!client,
    queryFn: ({ client: queryClient }) =>
      fetchVeVetroClaimableSubset({
        account: account!,
        client: client!,
        queryClient,
      }),
    queryKey: veVetroClaimableSubsetQueryKey(account),
  });
