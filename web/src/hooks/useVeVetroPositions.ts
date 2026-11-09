import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVeVetroPositions } from "fetchers/fetchVeVetroPositions";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const veVetroPositionsQueryKey = (account: Address | undefined) => [
  "ve-vetro-positions",
  account,
];

const veVetroPositionsOptions = (account: Address | undefined) =>
  queryOptions({
    enabled:
      apiUrl !== undefined && URL.canParse(apiUrl) && account !== undefined,
    queryFn: () => fetchVeVetroPositions(account!),
    queryKey: veVetroPositionsQueryKey(account),
    staleTime: 15_000,
  });

export function useVeVetroPositions() {
  const { address: account } = useAccount();
  return useQuery(veVetroPositionsOptions(account));
}
