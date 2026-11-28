import { queryOptions } from "@tanstack/react-query";
import { getIsTerminated } from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";

export const isTerminatedOptions = ({
  client,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => getIsTerminated(client!, { address: stakingVaultAddress }),
    queryKey: ["target-yield-pool-is-terminated", stakingVaultAddress],
  });
