import { queryOptions, useQuery } from "@tanstack/react-query";
import { getMaxRequestRedeem } from "@vetro-protocol/target-yield-earn/actions";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

export const maxRequestRedeemQueryKey = ({
  account,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  stakingVaultAddress: Address;
}) => ["target-yield-pool-max-request-redeem", account, stakingVaultAddress];

const maxRequestRedeemOptions = ({
  account,
  client,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!account && !!client,
    queryFn: () =>
      getMaxRequestRedeem(client!, {
        address: stakingVaultAddress,
        controller: account!,
        owner: account!,
      }),
    queryKey: maxRequestRedeemQueryKey({ account, stakingVaultAddress }),
  });

export function useMaxRequestRedeem(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    maxRequestRedeemOptions({ account, client, stakingVaultAddress }),
  );
}
