import { queryOptions, useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { previewRedeem } from "@vetro-protocol/gateway/actions";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const previewRedeemQueryKey = ({
  chainId,
  gatewayAddress,
  peggedTokenIn,
  tokenOut,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
  peggedTokenIn: bigint;
  tokenOut: Address;
}) => [
  "preview-redeem",
  chainId,
  gatewayAddress,
  tokenOut,
  peggedTokenIn.toString(),
];

export const previewRedeemTokenOptions = ({
  chainId,
  client,
  gatewayAddress,
  peggedTokenIn,
  tokenOut,
}: {
  chainId: Chain["id"];
  client: Client;
  gatewayAddress: Address;
  peggedTokenIn: bigint;
  tokenOut: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      peggedTokenIn > 0n
        ? previewRedeem(client, {
            address: gatewayAddress,
            peggedTokenIn,
            tokenOut,
          })
        : 0n,
    queryKey: previewRedeemQueryKey({
      chainId,
      gatewayAddress,
      peggedTokenIn,
      tokenOut,
    }),
  });

export const usePreviewRedeem = function ({
  peggedTokenIn,
  tokenOut,
}: {
  peggedTokenIn: bigint;
  tokenOut: Address;
}) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery(
    previewRedeemTokenOptions({
      chainId: ethereumChain.id,
      client: client!,
      gatewayAddress,
      peggedTokenIn,
      tokenOut,
    }),
  );
};
