import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { previewDeposit } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

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

  return useQuery({
    enabled: !!client && amountIn > 0n,
    queryFn: () =>
      previewDeposit(client!, {
        address: gatewayAddress,
        amountIn,
        tokenIn,
      }),
    queryKey: previewDepositQueryKey({
      amountIn,
      chainId: hemi.id,
      gatewayAddress,
      tokenIn,
    }),
  });
};
