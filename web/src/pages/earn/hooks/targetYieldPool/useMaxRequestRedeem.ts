import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchMaxRequestRedeem } from "fetchers/earn/targetYieldPool/fetchMaxRequestRedeem";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

import { useIsOpenToExit } from "./useIsOpenToExit";

export const maxRequestRedeemQueryKey = ({
  account,
  isOpenToExit,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  isOpenToExit: boolean | null | undefined;
  stakingVaultAddress: Address;
}) => [
  "target-yield-pool-max-request-redeem",
  account,
  stakingVaultAddress,
  isOpenToExit,
];

const maxRequestRedeemOptions = ({
  account,
  client,
  isOpenToExit,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  client: Client | undefined;
  isOpenToExit: boolean | null | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!account && !!client && isOpenToExit !== undefined,
    queryFn: () =>
      fetchMaxRequestRedeem({
        account: account!,
        client: client!,
        stakingVaultAddress,
      }),
    queryKey: maxRequestRedeemQueryKey({
      account,
      isOpenToExit,
      stakingVaultAddress,
    }),
  });

export function useMaxRequestRedeem(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const client = useEthereumClient();
  const { data: isOpenToExit } = useIsOpenToExit(stakingVaultAddress);

  return useQuery(
    maxRequestRedeemOptions({
      account,
      client,
      isOpenToExit,
      stakingVaultAddress,
    }),
  );
}
