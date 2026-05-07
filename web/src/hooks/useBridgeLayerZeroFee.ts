import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchBridgeLayerZeroFee } from "fetchers/fetchBridgeLayerZeroFee";
import type { Address, Chain, Client } from "viem";
import { useAccount, usePublicClient } from "wagmi";

export const bridgeLayerZeroFeeOptions = ({
  amount,
  client,
  destinationChainId,
  oftAddress,
  queryClient,
  recipient,
  sourceChainId,
}: {
  amount: bigint;
  client: Client | undefined;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  queryClient: QueryClient;
  recipient: Address | undefined;
  sourceChainId: Chain["id"];
}) =>
  queryOptions({
    enabled: !!client && !!recipient && amount > 0n,
    queryFn: () =>
      fetchBridgeLayerZeroFee({
        amount,
        client: client!,
        destinationChainId,
        oftAddress,
        queryClient,
        recipient: recipient!,
        sourceChainId,
      }),
    queryKey: [
      "bridge-layerzero-fee",
      sourceChainId,
      destinationChainId,
      oftAddress,
      recipient,
      amount.toString(),
    ],
  });

export const useBridgeLayerZeroFee = function ({
  amount,
  destinationChainId,
  oftAddress,
  sourceChainId,
}: {
  amount: bigint;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  sourceChainId: Chain["id"];
}) {
  const { address: account } = useAccount();
  const client = usePublicClient({ chainId: sourceChainId });
  const queryClient = useQueryClient();

  return useQuery(
    bridgeLayerZeroFeeOptions({
      amount,
      client,
      destinationChainId,
      oftAddress,
      queryClient,
      recipient: account,
      sourceChainId,
    }),
  );
};
