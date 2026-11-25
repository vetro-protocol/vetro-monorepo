import { queryOptions, useQuery } from "@tanstack/react-query";
import { getTokenConfig } from "@vetro-protocol/treasury/actions";
import { mainnet } from "networks/mainnet";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { treasuryAddressOptions } from "./useTreasuryAddress";

export const tokenConfigOptions = ({
  chainId,
  client,
  gatewayAddress,
  token,
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  gatewayAddress: Address;
  token: Address;
}) =>
  queryOptions({
    enabled: !!client,
    async queryFn({ client: queryClient }) {
      const treasuryAddress = await queryClient.ensureQueryData(
        treasuryAddressOptions({ chainId, client, gatewayAddress }),
      );
      return getTokenConfig(client!, { address: treasuryAddress, token });
    },
    queryKey: ["token-config", chainId, gatewayAddress, token],
  });

export const useTokenConfig = function ({
  gatewayAddress,
  token,
}: {
  gatewayAddress: Address;
  token: Address;
}) {
  const client = useEthereumClient();

  return useQuery(
    tokenConfigOptions({
      chainId: mainnet.id,
      client,
      gatewayAddress,
      token,
    }),
  );
};
