import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRequestRedeemGasUnits } from "fetchers/fetchRequestRedeemGasUnits";
import { mainnet } from "networks/mainnet";
import type { TokenWithGateway } from "types";
import type { Address, Chain, Client } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";

export const requestRedeemGasUnitsOptions = ({
  amount,
  approveAmount,
  chainId,
  client,
  fromToken,
  owner,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  fromToken: TokenWithGateway;
  owner: Address | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!owner && amount > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchRequestRedeemGasUnits({
        amount,
        approveAmount,
        client: client!,
        owner: owner!,
        queryClient,
        token: fromToken,
      }),
    queryKey: [
      "swap-request-redeem-gas-units",
      chainId,
      fromToken.gatewayAddress,
      fromToken.address,
      owner,
      amount.toString(),
    ],
  });

export const useSwapRequestRedeemFees = function ({
  amount,
  approveAmount,
  fromToken,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  fromToken: TokenWithGateway;
}) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();

  const { data: gasUnits, isError: isGasUnitsError } = useQuery(
    requestRedeemGasUnitsOptions({
      amount,
      approveAmount,
      chainId: mainnet.id,
      client,
      fromToken,
      owner,
    }),
  );

  return useEstimateFees({
    chainId: mainnet.id,
    gasUnits,
    isGasUnitsError,
  });
};
