import { queryOptions } from "@tanstack/react-query";
import { fetchVeVetroClaimableSubset } from "fetchers/fetchVeVetroClaimableSubset";
import type { Address } from "viem";

export const veVetroClaimableSubsetQueryKey = (
  account: Address | undefined,
) => ["ve-vetro-claimable-subset", account];

export const veVetroClaimableSubsetOptions = (account: Address | undefined) =>
  queryOptions({
    enabled: !!account,
    queryFn: ({ client: queryClient }) =>
      fetchVeVetroClaimableSubset({ account: account!, queryClient }),
    queryKey: veVetroClaimableSubsetQueryKey(account),
  });
