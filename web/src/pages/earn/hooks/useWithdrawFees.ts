import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { fetchWithdrawGasUnits } from "fetchers/fetchWithdrawGasUnits";
import { type Address, type Chain, type Client } from "viem";

export const withdrawGasUnitsOptions = ({
  account,
  amount,
  chainId,
  client,
  queryClient,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  amount: bigint;
  chainId: Chain["id"];
  client: Client | undefined;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!account && amount > 0n,
    queryFn: () =>
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
