import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getMintFee } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

const mintFeeQueryKey = ({
  chainId,
  gatewayAddress,
  token,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
  token: Address;
}) => ["mint-fee", chainId, gatewayAddress, token];

export const useMintFee = function (token: Address) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery({
    enabled: !!client,
    queryFn: () => getMintFee(client!, { address: gatewayAddress, token }),
    queryKey: mintFeeQueryKey({
      chainId: ethereumChain.id,
      gatewayAddress,
      token,
    }),
  });
};
