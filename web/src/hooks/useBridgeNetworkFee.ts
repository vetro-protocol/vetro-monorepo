import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchBridgeNetworkFee } from "fetchers/fetchBridgeNetworkFee";
import type { BridgeableToken } from "types";
import type { Address, Chain, Client } from "viem";
import { useAccount, usePublicClient } from "wagmi";

export const bridgeNetworkFeeOptions = ({
  amount,
  approveAmount,
  client,
  destinationChainId,
  oftAddress,
  owner,
  queryClient,
  recipient,
  sourceChainId,
  sourceToken,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client | undefined;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  owner: Address | undefined;
  queryClient: QueryClient;
  recipient: Address | undefined;
  sourceChainId: Chain["id"];
  sourceToken: BridgeableToken;
}) =>
  queryOptions({
    enabled: !!client && !!owner && !!recipient && amount > 0n,
    queryFn: () =>
      fetchBridgeNetworkFee({
        amount,
        approveAmount,
        client: client!,
        destinationChainId,
        oftAddress,
        owner: owner!,
        queryClient,
        recipient: recipient!,
        sourceChainId,
        sourceToken,
      }),
    queryKey: [
      "bridge-network-fee",
      sourceChainId,
      destinationChainId,
      oftAddress,
      sourceToken.address,
      owner,
      recipient,
      amount.toString(),
      approveAmount?.toString(),
    ],
  });

export const useBridgeNetworkFee = function ({
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

  return useQuery(
    bridgeNetworkFeeOptions({
      amount,
      approveAmount,
      client,
      destinationChainId,
      oftAddress: sourceToken.oftAdapterAddress ?? sourceToken.address,
      owner,
      queryClient,
      recipient: owner,
      sourceChainId: sourceToken.chainId,
      sourceToken,
    }),
  );
};
