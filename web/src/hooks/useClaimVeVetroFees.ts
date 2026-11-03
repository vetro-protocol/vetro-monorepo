import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClaimVeVetroFees } from "fetchers/fetchClaimVeVetroFees";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const claimVeVetroFeesOptions = (account: Address | undefined) =>
  queryOptions({
    enabled: !!account,
    queryFn: ({ client: queryClient }) =>
      fetchClaimVeVetroFees({ queryClient }),
    queryKey: ["ve-vetro-claim-fees", account],
  });

export function useClaimVeVetroFees() {
  const { address: account } = useAccount();
  return useQuery(claimVeVetroFeesOptions(account));
}
