import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTotalBridgeSendFees } from "fetchers/fetchTotalBridgeSendFees";
import type { BridgeableToken } from "types";
import type { Chain } from "viem";
import { useAccount, usePublicClient } from "wagmi";

export const useTotalBridgeSendFees = function ({
  amount,
  approveAmount,
  destinationChainId,
  sourceToken,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  destinationChainId: Chain["id"];
  sourceToken: BridgeableToken;
}) {
  const { address: owner } = useAccount();
  const client = usePublicClient({ chainId: sourceToken.chainId });
  const queryClient = useQueryClient();

  const oftAddress = sourceToken.oftAdapterAddress ?? sourceToken.address;

  return useQuery({
    enabled: !!client && !!owner && amount > 0n,
    queryFn: () =>
      fetchTotalBridgeSendFees({
        amount,
        approveAmount,
        client: client!,
        destinationChainId,
        oftAddress,
        owner: owner!,
        queryClient,
        recipient: owner!,
        sourceChainId: sourceToken.chainId,
        sourceToken,
      }),
    queryKey: [
      "total-bridge-send-fees",
      sourceToken.chainId,
      destinationChainId,
      oftAddress,
      sourceToken.address,
      owner,
      amount.toString(),
      approveAmount?.toString(),
    ],
  });
};
