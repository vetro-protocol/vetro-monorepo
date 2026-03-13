import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchTreasuryReserves } from "fetchers/fetchTreasuryReserves";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const useTreasuryReserves = function () {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client,
    queryFn: () =>
      fetchTreasuryReserves({
        client: client!,
        gatewayAddress,
        queryClient,
      }),
    queryKey: ["treasury-reserves", ethereumChain.id, gatewayAddress],
  });
};
