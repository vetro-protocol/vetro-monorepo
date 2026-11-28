import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVeVetroSnapshotPositions } from "fetchers/fetchVeVetroSnapshotPositions";
import { useHemiClient } from "hooks/useHemiClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

export const veVetroSnapshotPositionsQueryKey = (
  account: Address | undefined,
) => ["ve-vetro-snapshot-positions", account];

const veVetroSnapshotPositionsOptions = ({
  account,
  client,
}: {
  account: Address | undefined;
  client: Client | undefined;
}) =>
  queryOptions({
    enabled: !!account && !!client,
    queryFn: ({ client: queryClient }) =>
      fetchVeVetroSnapshotPositions({
        account: account!,
        client: client!,
        queryClient,
      }),
    queryKey: veVetroSnapshotPositionsQueryKey(account),
  });

export function useVeVetroSnapshotPositions() {
  const { address: account } = useAccount();
  const client = useHemiClient();
  return useQuery(veVetroSnapshotPositionsOptions({ account, client }));
}
