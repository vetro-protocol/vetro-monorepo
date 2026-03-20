import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchMintGasUnits } from "fetchers/fetchMintGasUnits";
import type { Token } from "types";
import { type Address, type Chain, type Client } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const mintGasUnitsQueryKey = ({
  amount,
  chainId,
  minPeggedTokenOut,
  owner,
  token,
}: {
  amount: bigint;
  chainId: Chain["id"];
  minPeggedTokenOut: bigint | undefined;
  owner: Address;
  token: Address;
}) => [
  "swap-mint-gas-units",
  chainId,
  token,
  owner,
  amount.toString(),
  minPeggedTokenOut?.toString(),
];

export const mintGasUnitsOptions = ({
  amount,
  approveAmount,
  chainId,
  client,
  fromToken,
  minPeggedTokenOut,
  owner,
  queryClient,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  fromToken: Token;
  minPeggedTokenOut: bigint | undefined;
  owner: Address | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled:
      !!client &&
      !!owner &&
      amount > 0n &&
      minPeggedTokenOut !== undefined &&
      minPeggedTokenOut > 0n,
    queryFn: () =>
      fetchMintGasUnits({
        amount,
        approveAmount,
        client: client!,
        minPeggedTokenOut: minPeggedTokenOut!,
        owner: owner!,
        queryClient,
        token: fromToken,
      }),
    queryKey: mintGasUnitsQueryKey({
      amount,
      chainId,
      minPeggedTokenOut: minPeggedTokenOut!,
      owner: owner!,
      token: fromToken.address,
    }),
  });

export const useSwapMintFees = function ({
  amount,
  approveAmount,
  fromToken,
  minPeggedTokenOut,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  fromToken: Token;
  minPeggedTokenOut: bigint | undefined;
}) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();

  const { data: gasUnits, isError: isGasUnitsError } = useQuery(
    mintGasUnitsOptions({
      amount,
      approveAmount,
      chainId: ethereumChain.id,
      client,
      fromToken,
      minPeggedTokenOut,
      owner,
      queryClient,
    }),
  );

  return useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits,
    isGasUnitsError,
  });
};
