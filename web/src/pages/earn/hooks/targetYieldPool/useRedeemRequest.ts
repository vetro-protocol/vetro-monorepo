import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRedeemRequest } from "fetchers/earn/targetYieldPool/fetchRedeemRequest";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { getRedeemRequestState } from "./getRedeemRequestState";

export const redeemRequestQueryKey = ({
  controller,
  stakingVaultAddress,
}: {
  controller: Address | undefined;
  stakingVaultAddress: Address;
}) => ["target-yield-pool-redeem-request", stakingVaultAddress, controller];

const redeemRequestOptions = ({
  controller,
  stakingVaultAddress,
}: {
  controller: Address | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!controller,
    queryFn: () =>
      fetchRedeemRequest({ controller: controller!, stakingVaultAddress }),
    queryKey: redeemRequestQueryKey({ controller, stakingVaultAddress }),
    select: getRedeemRequestState,
  });

export function useRedeemRequest(stakingVaultAddress: Address) {
  const { address: controller } = useAccount();

  return useQuery(redeemRequestOptions({ controller, stakingVaultAddress }));
}
