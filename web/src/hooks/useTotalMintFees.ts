import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTotalMintFees } from "fetchers/fetchTotalMintFees";
import type { Token } from "types";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const useTotalMintFees = function ({
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
        chain: ethereumChain,
        client: client!,
        fromToken,
        minPeggedTokenOut: minPeggedTokenOut!,
        owner: owner!,
        queryClient,
      }),
    queryKey: [
      "total-mint-fees",
      ethereumChain.id,
      fromToken.address,
      owner,
      amount.toString(),
      minPeggedTokenOut?.toString(),
    ],
  });
};
