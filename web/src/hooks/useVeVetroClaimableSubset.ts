import { queryOptions } from "@tanstack/react-query";
import { fetchVeVetroClaimableSubset } from "fetchers/fetchVeVetroClaimableSubset";
import type { Address } from "viem";

export const veVetroClaimableSubsetOptions = (account: Address | undefined) =>
  queryOptions({
    enabled: !!account,
    queryFn: fetchVeVetroClaimableSubset,
    queryKey: ["ve-vetro-claimable-subset", account],
  });
