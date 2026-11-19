import { queryOptions } from "@tanstack/react-query";
import { fetchWithdrawGasUnits } from "fetchers/fetchWithdrawGasUnits";
import { type Address, type Chain, type Client } from "viem";

export const withdrawGasUnitsOptions = ({
  account,
  amount,
  chainId,
  client,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  amount: bigint;
  chainId: Chain["id"];
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!account && amount > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchWithdrawGasUnits({
        account: account!,
        amount,
        client: client!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: [
      "earn-withdraw-gas-units",
      chainId,
      account,
      amount.toString(),
      stakingVaultAddress,
    ],
  });
