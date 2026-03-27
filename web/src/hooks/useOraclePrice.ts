import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getPrice } from "@vetro/treasury/actions";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";
import { treasuryAddressOptions } from "./useTreasuryAddress";

const oraclePriceOptions = ({
  chainId,
  client,
  gatewayAddress,
  queryClient,
  token,
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  gatewayAddress: Address;
  queryClient: QueryClient;
  token: Address;
}) =>
  queryOptions({
    enabled: !!client,
    async queryFn() {
      const treasuryAddress = await queryClient.fetchQuery(
        treasuryAddressOptions({ chainId, client, gatewayAddress }),
      );
      return getPrice(client!, { address: treasuryAddress, token });
    },
    queryKey: ["oracle-price", chainId, gatewayAddress, token],
  });

export const useOraclePrice = function (token: Address) {
  const client = useEthereumClient();
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();

  return useQuery(
    oraclePriceOptions({
      chainId: ethereumChain.id,
      client,
      gatewayAddress: getGatewayAddress(ethereumChain.id),
      queryClient,
      token,
    }),
  );
};
