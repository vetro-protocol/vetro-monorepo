import type { QueryClient } from "@tanstack/react-query";
import { bridgeLayerZeroFeeOptions } from "hooks/useBridgeLayerZeroFee";
import { bridgeNetworkFeeOptions } from "hooks/useBridgeNetworkFee";
import type { BridgeableToken } from "types";
import type { Address, Chain, Client } from "viem";

/**
 * Total bridge send fees in USD: the network fee on the source chain plus
 * the LayerZero native messaging fee.
 */
export const fetchTotalBridgeSendFees = async function ({
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
  client: Client;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  owner: Address;
  queryClient: QueryClient;
  recipient: Address;
  sourceChainId: Chain["id"];
  sourceToken: BridgeableToken;
}) {
  const [layerZeroFeeUsd, networkFeeUsd] = await Promise.all([
    queryClient.ensureQueryData(
      bridgeLayerZeroFeeOptions({
        amount,
        client,
        destinationChainId,
        oftAddress,
        queryClient,
        recipient,
        sourceChainId,
      }),
    ),
    queryClient.ensureQueryData(
      bridgeNetworkFeeOptions({
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
      }),
    ),
  ]);

  return layerZeroFeeUsd + networkFeeUsd;
};
