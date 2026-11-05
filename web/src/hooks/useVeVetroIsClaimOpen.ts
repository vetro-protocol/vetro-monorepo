import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVeVetroIsClaimOpen } from "fetchers/fetchVeVetroIsClaimOpen";
import { useHemiClient } from "hooks/useHemiClient";
import type { Client } from "viem";

const veVetroIsClaimOpenOptions = (client: Client | undefined) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => fetchVeVetroIsClaimOpen(client!),
    queryKey: ["ve-vetro-is-claim-open"],
  });

export function useVeVetroIsClaimOpen() {
  const client = useHemiClient();
  return useQuery(veVetroIsClaimOpenOptions(client));
}
