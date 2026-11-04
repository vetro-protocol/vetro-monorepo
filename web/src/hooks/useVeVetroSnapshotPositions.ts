import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVeVetroSnapshotPositions } from "fetchers/fetchVeVetroSnapshotPositions";
import type { Address } from "viem";
import { useAccount } from "wagmi";

export const veVetroSnapshotPositionsQueryKey = (
  account: Address | undefined,
) => ["ve-vetro-snapshot-positions", account];

const veVetroSnapshotPositionsOptions = (account: Address | undefined) =>
  queryOptions({
    enabled: !!account,
    queryFn: ({ client: queryClient }) =>
      fetchVeVetroSnapshotPositions({ account: account!, queryClient }),
    queryKey: veVetroSnapshotPositionsQueryKey(account),
  });

export function useVeVetroSnapshotPositions() {
  const { address: account } = useAccount();
  return useQuery(veVetroSnapshotPositionsOptions(account));
}
