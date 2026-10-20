import { queryOptions } from "@tanstack/react-query";
import { getMaxRequestDeposit } from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";

export const maxRequestDepositQueryKey = ({
  account,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  stakingVaultAddress: Address;
}) => ["target-yield-pool-max-request-deposit", account, stakingVaultAddress];

export const maxRequestDepositOptions = ({
  account,
  client,
  isEntryWindowOpen,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  client: Client | undefined;
  isEntryWindowOpen: boolean | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!account && !!client && isEntryWindowOpen !== undefined,
    queryFn: () =>
      getMaxRequestDeposit(client!, {
        address: stakingVaultAddress,
        controller: account!,
        owner: account!,
      }),
    queryKey: [
      ...maxRequestDepositQueryKey({ account, stakingVaultAddress }),
      isEntryWindowOpen,
    ],
  });
