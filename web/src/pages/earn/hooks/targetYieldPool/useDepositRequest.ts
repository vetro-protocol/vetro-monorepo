import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchDepositRequest } from "fetchers/earn/targetYieldPool/fetchDepositRequest";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

import { getDepositRequestState } from "./getDepositRequestState";
import { useIsEntryWindowOpen } from "./useIsEntryWindowOpen";

export const depositRequestQueryKey = ({
  controller,
  isEntryWindowOpen,
  stakingVaultAddress,
}: {
  controller: Address | undefined;
  isEntryWindowOpen: boolean | undefined;
  stakingVaultAddress: Address;
}) => [
  "target-yield-pool-deposit-request",
  stakingVaultAddress,
  controller,
  isEntryWindowOpen,
];

export const depositRequestOptions = ({
  client,
  controller,
  isEntryWindowOpen,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  controller: Address | undefined;
  isEntryWindowOpen: boolean | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!controller && isEntryWindowOpen !== undefined,
    queryFn: () =>
      fetchDepositRequest({
        client: client!,
        controller: controller!,
        stakingVaultAddress,
      }),
    queryKey: depositRequestQueryKey({
      controller,
      isEntryWindowOpen,
      stakingVaultAddress,
    }),
    select: getDepositRequestState,
  });

export function useDepositRequest(stakingVaultAddress: Address) {
  const { address: controller } = useAccount();
  const client = useEthereumClient();
  const isEntryWindowOpen = useIsEntryWindowOpen(stakingVaultAddress);

  return useQuery(
    depositRequestOptions({
      client,
      controller,
      isEntryWindowOpen,
      stakingVaultAddress,
    }),
  );
}
