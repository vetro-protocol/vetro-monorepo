import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getMintFee } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const mintFeeQueryKey = ({
  chainId,
  gatewayAddress,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
}) => ["mint-fee", chainId, gatewayAddress];

export const useMintFee = function () {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery({
    enabled: !!client,
    queryFn: () => getMintFee(client!, { address: gatewayAddress }),
    queryKey: mintFeeQueryKey({ chainId: ethereumChain.id, gatewayAddress }),
  });
};
