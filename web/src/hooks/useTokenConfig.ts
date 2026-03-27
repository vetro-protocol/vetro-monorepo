import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { getTokenConfig } from "@vetro/treasury/actions";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";
import { treasuryAddressOptions } from "./useTreasuryAddress";

const tokenConfigOptions = ({
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
      return getTokenConfig(client!, { address: treasuryAddress, token });
    },
    queryKey: ["token-config", chainId, gatewayAddress, token],
    select: ([
      vault,
      oracle,
      stalePeriod,
      depositActive,
      withdrawActive,
      decimals,
    ]) => ({
      decimals,
      depositActive,
      oracle,
      stalePeriod,
      vault,
      withdrawActive,
    }),
  });

export const useTokenConfig = function (token: Address) {
  const client = useEthereumClient();
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();

  return useQuery(
    tokenConfigOptions({
      chainId: ethereumChain.id,
      client,
      gatewayAddress: getGatewayAddress(ethereumChain.id),
      queryClient,
      token,
    }),
  );
};
