import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { previewRedeem } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

import { useHemi } from "./useHemi";
import { useHemiClient } from "./useHemiClient";

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
}) => ["preview-redeem", chainId, gatewayAddress, tokenOut, peggedTokenIn];

export const usePreviewRedeem = function ({
  peggedTokenIn,
  tokenOut,
}: {
  peggedTokenIn: bigint;
  tokenOut: Address;
}) {
  const hemi = useHemi();
  const client = useHemiClient();
  const gatewayAddress = getGatewayAddress(hemi.id);

  return useQuery({
    enabled: !!client && peggedTokenIn > 0n,
    queryFn: () =>
      previewRedeem(client!, {
        address: gatewayAddress,
        peggedTokenIn,
        tokenOut,
      }),
    queryKey: previewRedeemQueryKey({
      chainId: hemi.id,
      gatewayAddress,
      peggedTokenIn,
      tokenOut,
    }),
  });
};
