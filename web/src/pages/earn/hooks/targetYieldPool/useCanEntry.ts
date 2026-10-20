import { queryOptions } from "@tanstack/react-query";
import { fetchCanEntry } from "fetchers/earn/targetYieldPool/fetchCanEntry";
import type { Address, Client } from "viem";

export const canEntryOptions = ({
  client,
  owner,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  owner: Address | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!owner,
    queryFn: () =>
      fetchCanEntry({ client: client!, owner: owner!, stakingVaultAddress }),
    queryKey: ["target-yield-pool-can-entry", stakingVaultAddress, owner],
  });
