import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getRedeemFee } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

import { useHemi } from "./useHemi";
import { useHemiClient } from "./useHemiClient";

export const redeemFeeQueryKey = ({
  chainId,
  gatewayAddress,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
}) => ["redeem-fee", chainId, gatewayAddress];

export const useRedeemFee = function () {
  const hemi = useHemi();
  const client = useHemiClient();
  const gatewayAddress = getGatewayAddress(hemi.id);

  return useQuery({
    enabled: !!client,
    queryFn: () => getRedeemFee(client!, { address: gatewayAddress }),
    queryKey: redeemFeeQueryKey({ chainId: hemi.id, gatewayAddress }),
  });
};
