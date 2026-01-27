import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getMintFee } from "@vetro/gateway/actions";
import type { Address, Chain } from "viem";

import { useHemi } from "./useHemi";
import { useHemiClient } from "./useHemiClient";

export const mintFeeQueryKey = ({
  chainId,
  gatewayAddress,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
}) => ["mint-fee", chainId, gatewayAddress];

export const useMintFee = function () {
  const hemi = useHemi();
  const client = useHemiClient();
  const gatewayAddress = getGatewayAddress(hemi.id);

  return useQuery({
    enabled: !!client,
    queryFn: () => getMintFee(client!, { address: gatewayAddress }),
    queryKey: mintFeeQueryKey({ chainId: hemi.id, gatewayAddress }),
  });
};
