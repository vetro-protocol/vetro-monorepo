import { queryOptions } from "@tanstack/react-query";
import { getIsShutdown } from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";

export const isShutdownOptions = ({
  client,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => getIsShutdown(client!, { address: stakingVaultAddress }),
    queryKey: ["target-yield-pool-is-shutdown", stakingVaultAddress],
  });
