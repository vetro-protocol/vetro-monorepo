import { queryOptions } from "@tanstack/react-query";
import { fetchVeVetroConfig } from "fetchers/fetchVeVetroConfig";
import type { Client } from "viem";

export const veVetroConfigOptions = (client: Client | undefined) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => fetchVeVetroConfig(client!),
    queryKey: ["ve-vetro-config"],
    staleTime: Infinity,
  });
