import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClaimVeVetroFees } from "fetchers/fetchClaimVeVetroFees";
import { useHemiClient } from "hooks/useHemiClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const claimVeVetroFeesOptions = ({
  account,
  client,
  positionCount,
}: {
  account: Address | undefined;
  client: Client | undefined;
  positionCount: number | undefined;
}) =>
  queryOptions({
    enabled: !!account && !!client && positionCount !== undefined,
    queryFn: ({ client: queryClient }) =>
      fetchClaimVeVetroFees({
        client: client!,
        positionCount: positionCount!,
        queryClient,
      }),
    queryKey: ["ve-vetro-claim-fees", account, positionCount],
  });

export function useClaimVeVetroFees(positionCount: number | undefined) {
  const { address: account } = useAccount();
  const client = useHemiClient();
  return useQuery(claimVeVetroFeesOptions({ account, client, positionCount }));
}
