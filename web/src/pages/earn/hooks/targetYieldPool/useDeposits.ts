import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchDeposits } from "fetchers/earn/targetYieldPool/fetchDeposits";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Client } from "viem";

import { targetYieldVaultReadAddress } from "../../targetYieldVaults";

import { useEpochId } from "./useEpochId";

const depositsOptions = ({
  client,
  epochId,
}: {
  client: Client | undefined;
  epochId: bigint | undefined;
}) =>
  queryOptions({
    enabled: !!client && epochId !== undefined,
    queryFn: ({ client: queryClient }) =>
      fetchDeposits({
        client: client!,
        epochId: epochId!,
        queryClient,
        stakingVaultAddress: targetYieldVaultReadAddress,
      }),
    queryKey: [
      "target-yield-pool-deposits",
      client?.chain?.id,
      targetYieldVaultReadAddress,
      epochId?.toString(),
    ],
  });

export function useDeposits() {
  const client = useEthereumClient();
  const { data: epochId } = useEpochId();

  return useQuery(depositsOptions({ client, epochId }));
}
