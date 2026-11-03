import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVeVetroSnapshotPositions } from "fetchers/fetchVeVetroSnapshotPositions";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const veVetroSnapshotPositionsOptions = (account: Address | undefined) =>
  queryOptions({
    enabled: !!account,
    queryFn: ({ client: queryClient }) =>
      fetchVeVetroSnapshotPositions({ account: account!, queryClient }),
    queryKey: ["ve-vetro-snapshot-positions", account],
  });

export function useVeVetroSnapshotPositions() {
  const { address: account } = useAccount();
  return useQuery(veVetroSnapshotPositionsOptions(account));
}
