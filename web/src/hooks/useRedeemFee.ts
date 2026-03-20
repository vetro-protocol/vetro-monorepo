import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getRedeemFee } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

const redeemFeeQueryKey = ({
  chainId,
  gatewayAddress,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
}) => ["redeem-fee", chainId, gatewayAddress];

export const useRedeemFee = function () {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery({
    enabled: !!client,
    queryFn: () => getRedeemFee(client!, { address: gatewayAddress }),
    queryKey: redeemFeeQueryKey({ chainId: ethereumChain.id, gatewayAddress }),
  });
};
