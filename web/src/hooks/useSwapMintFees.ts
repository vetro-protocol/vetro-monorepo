import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { fetchMintGasUnits } from "fetchers/fetchMintGasUnits";
import { mainnet } from "networks/mainnet";
import { depositGasUnitsOptions } from "pages/earn/hooks/useDepositFees";
import type { TokenWithGateway } from "types";
import { type Address, type Chain, type Client } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";

export type StakeGasParams = {
  amount: bigint;
  approveAmount: bigint | undefined;
  stakingVaultAddress: Address;
  token: Token;
};

export const mintGasUnitsOptions = ({
  amount,
  approveAmount,
  chainId,
  client,
  fromToken,
  minPeggedTokenOut,
  owner,
  stake,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  fromToken: TokenWithGateway;
  minPeggedTokenOut: bigint | undefined;
  owner: Address | undefined;
  stake: StakeGasParams | undefined;
}) =>
  queryOptions({
    enabled:
      !!client &&
      !!owner &&
      amount > 0n &&
      minPeggedTokenOut !== undefined &&
      minPeggedTokenOut > 0n,
    queryFn: ({ client: queryClient }) =>
      Promise.all([
        fetchMintGasUnits({
          amount,
          approveAmount,
          client: client!,
          minPeggedTokenOut: minPeggedTokenOut!,
          owner: owner!,
          queryClient,
          token: fromToken,
        }),
        stake
          ? queryClient.ensureQueryData(
              depositGasUnitsOptions({
                ...stake,
                chainId,
                client,
                owner,
              }),
            )
          : 0n,
      ]).then(([mintGas, stakeGas]) => mintGas + stakeGas),
    queryKey: [
      "swap-mint-gas-units",
      chainId,
      fromToken.gatewayAddress,
      fromToken.address,
      owner,
      amount.toString(),
      minPeggedTokenOut?.toString(),
      stake?.stakingVaultAddress,
      stake?.amount.toString(),
      stake?.approveAmount?.toString(),
    ],
  });

export const useSwapMintFees = function ({
  amount,
  approveAmount,
  fromToken,
  minPeggedTokenOut,
  stake,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  fromToken: TokenWithGateway;
  minPeggedTokenOut: bigint | undefined;
  stake: StakeGasParams | undefined;
}) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();

  const { data: gasUnits, isError: isGasUnitsError } = useQuery(
    mintGasUnitsOptions({
      amount,
      approveAmount,
      chainId: mainnet.id,
      client,
      fromToken,
      minPeggedTokenOut,
      owner,
      stake,
    }),
  );

  return useEstimateFees({
    chainId: mainnet.id,
    gasUnits,
    isGasUnitsError,
  });
};
