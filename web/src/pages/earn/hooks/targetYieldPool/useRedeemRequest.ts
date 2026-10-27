import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRedeemRequest } from "fetchers/earn/targetYieldPool/fetchRedeemRequest";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

import { getRedeemRequestState } from "./getRedeemRequestState";
import { useIsOpenToExit } from "./useIsOpenToExit";

export const redeemRequestQueryKey = ({
  controller,
  isOpenToExit,
  stakingVaultAddress,
}: {
  controller: Address | undefined;
  isOpenToExit: boolean | null | undefined;
  stakingVaultAddress: Address;
}) => [
  "target-yield-pool-redeem-request",
  stakingVaultAddress,
  controller,
  isOpenToExit,
];

const redeemRequestOptions = ({
  client,
  controller,
  isOpenToExit,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  controller: Address | undefined;
  isOpenToExit: boolean | null | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!controller && isOpenToExit !== undefined,
    queryFn: ({ client: queryClient }) =>
      fetchRedeemRequest({
        client: client!,
        controller: controller!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: redeemRequestQueryKey({
      controller,
      isOpenToExit,
      stakingVaultAddress,
    }),
    select: getRedeemRequestState,
  });

export function useRedeemRequest(stakingVaultAddress: Address) {
  const { address: controller } = useAccount();
  const client = useEthereumClient();
  const { data: isOpenToExit } = useIsOpenToExit(stakingVaultAddress);

  return useQuery(
    redeemRequestOptions({
      client,
      controller,
      isOpenToExit,
      stakingVaultAddress,
    }),
  );
}
