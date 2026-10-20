import { queryOptions, useQuery } from "@tanstack/react-query";
import { getMaxRequestDeposit } from "@vetro-protocol/target-yield-earn/actions";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

export const maxRequestDepositQueryKey = ({
  account,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  stakingVaultAddress: Address;
}) => ["target-yield-pool-max-request-deposit", account, stakingVaultAddress];

const maxRequestDepositOptions = ({
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
      getMaxRequestDeposit(client!, {
        address: stakingVaultAddress,
        controller: account!,
        owner: account!,
      }),
    queryKey: maxRequestDepositQueryKey({ account, stakingVaultAddress }),
  });

export function useMaxRequestDeposit(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    maxRequestDepositOptions({ account, client, stakingVaultAddress }),
  );
}
