import { queryOptions } from "@tanstack/react-query";
import { getIsPaused } from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";

export const isPausedOptions = ({
  client,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => getIsPaused(client!, { address: stakingVaultAddress }),
    queryKey: ["target-yield-pool-is-paused", stakingVaultAddress],
  });
