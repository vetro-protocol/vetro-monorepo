import { queryOptions } from "@tanstack/react-query";
import { getEpoch } from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";

export type Epoch = Awaited<ReturnType<typeof getEpoch>>;

export const epochOptions = ({
  client,
  epochId,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  epochId: bigint | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!epochId,
    queryFn: () =>
      getEpoch(client!, { address: stakingVaultAddress, epochId: epochId! }),
    queryKey: [
      "target-yield-pool-epoch",
      stakingVaultAddress,
      epochId?.toString(),
    ],
  });
