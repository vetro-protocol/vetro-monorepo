import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getRedeemFee } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

const redeemFeeQueryKey = ({
  chainId,
  gatewayAddress,
  token,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
  token: Address;
}) => ["redeem-fee", chainId, gatewayAddress, token];

export const useRedeemFee = function (token: Address) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery({
    enabled: !!client,
    queryFn: () => getRedeemFee(client!, { address: gatewayAddress, token }),
    queryKey: redeemFeeQueryKey({
      chainId: ethereumChain.id,
      gatewayAddress,
      token,
    }),
  });
};
