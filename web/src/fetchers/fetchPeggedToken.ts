import type { QueryClient } from "@tanstack/react-query";
import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import type { TokenWithGateway } from "types";
import type { Address, Client } from "viem";

export const fetchPeggedToken = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}): Promise<TokenWithGateway> {
  const address = await getPeggedToken(client, {
    address: gatewayAddress,
  });

  const token = await queryClient.ensureQueryData(
    tokenInfoOptions({
      address,
      chainId: client.chain!.id,
      client,
    }),
  );

  return { ...token, gatewayAddress };
};
