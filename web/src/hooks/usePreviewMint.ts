import { useQuery, queryOptions } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { previewDeposit } from "@vetro-protocol/gateway/actions";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const previewMintQueryKey = ({
  amountIn,
  chainId,
  gatewayAddress,
  tokenIn,
}: {
  amountIn: bigint;
  chainId: Chain["id"];
  gatewayAddress: Address;
  tokenIn: Address;
}) => ["preview-mint", chainId, gatewayAddress, tokenIn, amountIn.toString()];

export const previewMintTokenOptions = ({
  amountIn,
  chainId,
  client,
  gatewayAddress,
  tokenIn,
}: {
  amountIn: bigint;
  client: Client;
  chainId: Chain["id"];
  gatewayAddress: Address;
  tokenIn: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      amountIn > 0n
        ? previewDeposit(client, {
            address: gatewayAddress,
            amountIn,
            tokenIn,
          })
        : 0n,
    queryKey: previewMintQueryKey({
      amountIn,
      chainId,
      gatewayAddress,
      tokenIn,
    }),
  });

export const usePreviewMint = function ({
  amountIn,
  tokenIn,
}: {
  amountIn: bigint;
  tokenIn: Address;
}) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery(
    previewMintTokenOptions({
      amountIn,
      chainId: ethereumChain.id,
      client: client!,
      gatewayAddress,
      tokenIn,
    }),
  );
};
