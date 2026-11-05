import { queryOptions, useQuery } from "@tanstack/react-query";
import { isClaimOpen } from "@vetro-protocol/ve-vetro/actions";
import { useHemiClient } from "hooks/useHemiClient";
import { veVetroContracts } from "utils/veVetro";
import type { Client } from "viem";

const veVetroIsClaimOpenOptions = (client: Client | undefined) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      isClaimOpen(client!, { address: veVetroContracts.distributor }),
    queryKey: ["ve-vetro-is-claim-open"],
  });

export function useVeVetroIsClaimOpen() {
  const client = useHemiClient();
  return useQuery(veVetroIsClaimOpenOptions(client));
}
