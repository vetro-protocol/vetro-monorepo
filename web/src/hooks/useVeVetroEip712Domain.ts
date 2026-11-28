import { queryOptions } from "@tanstack/react-query";
import { fetchVeVetroEip712Domain } from "fetchers/fetchVeVetroEip712Domain";
import type { Client } from "viem";

export const veVetroEip712DomainOptions = (client: Client | undefined) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => fetchVeVetroEip712Domain(client!),
    queryKey: ["ve-vetro-eip712-domain"],
    staleTime: Infinity,
  });
