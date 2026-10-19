import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchDepositRequest } from "fetchers/earn/targetYieldPool/fetchDepositRequest";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

import { getDepositRequestState } from "./getDepositRequestState";

const depositRequestOptions = ({
  client,
  controller,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  controller: Address | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!controller,
    queryFn: () =>
      fetchDepositRequest({
        client: client!,
        controller: controller!,
        stakingVaultAddress,
      }),
    queryKey: [
      "target-yield-pool-deposit-request",
      stakingVaultAddress,
      controller,
    ],
    select: getDepositRequestState,
  });

export function useDepositRequest(stakingVaultAddress: Address) {
  const { address: controller } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    depositRequestOptions({ client, controller, stakingVaultAddress }),
  );
}
