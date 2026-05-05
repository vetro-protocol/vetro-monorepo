import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTotalRequestRedeemFees } from "fetchers/fetchTotalRequestRedeemFees";
import type { TokenWithGateway } from "types";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const useTotalRequestRedeemFees = function ({
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
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client && !!owner && amount > 0n,
    queryFn: () =>
      fetchTotalRequestRedeemFees({
        amount,
        approveAmount,
        chain: ethereumChain,
        client: client!,
        fromToken,
        owner: owner!,
        queryClient,
      }),
    queryKey: [
      "total-request-redeem-fees",
      ethereumChain.id,
      fromToken.address,
      fromToken.gatewayAddress,
      owner,
      amount.toString(),
    ],
  });
};
