import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClaimVeVetroFees } from "fetchers/fetchClaimVeVetroFees";
import { useHemiClient } from "hooks/useHemiClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const claimVeVetroFeesOptions = ({
  account,
  client,
}: {
  account: Address | undefined;
  client: Client | undefined;
}) =>
  queryOptions({
    enabled: !!account && !!client,
    queryFn: ({ client: queryClient }) =>
      fetchClaimVeVetroFees({ client: client!, queryClient }),
    queryKey: ["ve-vetro-claim-fees", account],
  });

export function useClaimVeVetroFees() {
  const { address: account } = useAccount();
  const client = useHemiClient();
  return useQuery(claimVeVetroFeesOptions({ account, client }));
}
