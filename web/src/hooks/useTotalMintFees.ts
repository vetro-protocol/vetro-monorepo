import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTotalMintFees } from "fetchers/fetchTotalMintFees";
import { mainnet } from "networks/mainnet";
import type { TokenWithGateway } from "types";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import type { StakeGasParams } from "./useSwapMintFees";

export const useTotalMintFees = function ({
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
  const queryClient = useQueryClient();

  return useQuery({
    enabled:
      !!client &&
      !!owner &&
      amount > 0n &&
      minPeggedTokenOut !== undefined &&
      minPeggedTokenOut > 0n,
    queryFn: () =>
      fetchTotalMintFees({
        amount,
        approveAmount,
        chain: mainnet,
        client: client!,
        fromToken,
        minPeggedTokenOut: minPeggedTokenOut!,
        owner: owner!,
        queryClient,
        stake,
      }),
    queryKey: [
      "total-mint-fees",
      mainnet.id,
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
};
