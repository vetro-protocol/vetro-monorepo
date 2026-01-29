import {
  useQuery,
  queryOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { previewDeposit } from "@vetro/gateway/actions";
import type { Address, Chain, Client } from "viem";

import { useHemi } from "./useHemi";
import { useHemiClient } from "./useHemiClient";

export const previewDepositQueryKey = ({
  amountIn,
  chainId,
  gatewayAddress,
  tokenIn,
}: {
  amountIn: bigint;
  chainId: Chain["id"];
  gatewayAddress: Address;
  tokenIn: Address;
}) => ["preview-deposit", chainId, gatewayAddress, tokenIn, amountIn];

export const previewDepositTokenOptions = ({
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
  options?: Omit<UseQueryOptions<bigint, Error>, "queryKey" | "queryFn">;
  tokenIn: Address;
}) =>
  queryOptions({
    queryFn: () =>
      previewDeposit(client, {
        address: gatewayAddress,
        amountIn,
        tokenIn,
      }),
    queryKey: previewDepositQueryKey({
      amountIn,
      chainId,
      gatewayAddress,
      tokenIn,
    }),
  });

export const usePreviewDeposit = function ({
  amountIn,
  tokenIn,
}: {
  amountIn: bigint;
  tokenIn: Address;
}) {
  const hemi = useHemi();
  const client = useHemiClient();
  const gatewayAddress = getGatewayAddress(hemi.id);

  return useQuery(
    previewDepositTokenOptions({
      amountIn,
      chainId: hemi.id,
      client: client!,
      gatewayAddress,
      options: {
        enabled: !!client && amountIn > 0n,
      },
      tokenIn,
    }),
  );
};
