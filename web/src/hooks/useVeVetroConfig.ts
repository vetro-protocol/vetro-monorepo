import { queryOptions } from "@tanstack/react-query";
import { getConfig } from "@vetro-protocol/ve-vetro/actions";
import { veVetroContracts } from "utils/veVetro";
import type { Client } from "viem";

export const veVetroConfigOptions = (client: Client | undefined) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      getConfig(client!, { address: veVetroContracts.distributor }),
    queryKey: ["ve-vetro-config"],
    staleTime: Infinity,
  });
