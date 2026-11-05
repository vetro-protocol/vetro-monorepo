import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchVeVetroIsClaimOpen } from "fetchers/fetchVeVetroIsClaimOpen";

const veVetroIsClaimOpenOptions = () =>
  queryOptions({
    queryFn: fetchVeVetroIsClaimOpen,
    queryKey: ["ve-vetro-is-claim-open"],
  });

export const useVeVetroIsClaimOpen = () =>
  useQuery(veVetroIsClaimOpenOptions());
