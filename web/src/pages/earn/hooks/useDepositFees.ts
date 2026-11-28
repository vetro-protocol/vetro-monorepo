import { queryOptions } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { fetchDepositGasUnits } from "fetchers/fetchDepositGasUnits";
import { type Address, type Chain, type Client } from "viem";

export const depositGasUnitsOptions = ({
  amount,
  approveAmount,
  chainId,
  client,
  owner,
  stakingVaultAddress,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  owner: Address | undefined;
  stakingVaultAddress: Address;
  token: Token | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!owner && !!token && amount > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchDepositGasUnits({
        amount,
        approveAmount,
        client: client!,
        owner: owner!,
        queryClient,
        stakingVaultAddress,
        token: token!,
      }),
    queryKey: [
      "earn-deposit-gas-units",
      chainId,
      token?.address,
      owner,
      amount.toString(),
      stakingVaultAddress,
    ],
  });
