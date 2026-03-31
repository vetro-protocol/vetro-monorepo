import type { QueryClient } from "@tanstack/react-query";
import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import type { Address, Client } from "viem";

export const fetchVusd = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) {
  const address = await getPeggedToken(client, {
    address: gatewayAddress,
  });

  return queryClient.ensureQueryData(
    tokenInfoOptions({
      address,
      chainId: client.chain!.id,
      client,
    }),
  );
};
