import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { fetchDepositGasUnits } from "fetchers/fetchDepositGasUnits";
import type { Token } from "types";
import { type Address, type Chain, type Client } from "viem";

export const depositGasUnitsOptions = ({
  amount,
  approveAmount,
  chainId,
  client,
  owner,
  queryClient,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  owner: Address | undefined;
  queryClient: QueryClient;
  token: Token | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!owner && !!token && amount > 0n,
    queryFn: () =>
      fetchDepositGasUnits({
        amount,
        approveAmount,
        client: client!,
        owner: owner!,
        queryClient,
        token: token!,
      }),
    queryKey: [
      "earn-deposit-gas-units",
      chainId,
      token?.address,
      owner,
      amount.toString(),
    ],
  });
