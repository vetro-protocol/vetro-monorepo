import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTreasuryReserves } from "fetchers/fetchTreasuryReserves";
import { mainnet } from "networks/mainnet";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

export const treasuryReservesQueryKey = ({
  chainId,
  gatewayAddress,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
}) => ["treasury-reserves", chainId, gatewayAddress];

export const treasuryReservesOptions = ({
  chainId,
  client,
  gatewayAddress,
}: {
  chainId: Chain["id"];
  client: Client;
  gatewayAddress: Address;
}) =>
  queryOptions({
    enabled: !!client?.chain,
    queryFn: ({ client: queryClient }) =>
      fetchTreasuryReserves({ client, gatewayAddress, queryClient }),
    queryKey: treasuryReservesQueryKey({ chainId, gatewayAddress }),
  });

export const useTreasuryReserves = function (gatewayAddress: Address) {
  const client = useEthereumClient();

  return useQuery(
    treasuryReservesOptions({
      chainId: mainnet.id,
      client: client!,
      gatewayAddress,
    }),
  );
};
