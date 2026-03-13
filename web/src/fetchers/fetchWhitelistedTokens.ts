import type { QueryClient } from "@tanstack/react-query";
import { getTreasury, getWhitelistedTokens } from "@vetro/gateway/actions";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import type { Address, Client } from "viem";

export const fetchWhitelistedTokens = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) {
  const treasuryAddress = await getTreasury(client, {
    address: gatewayAddress,
  });

  const tokenAddresses = await getWhitelistedTokens(client, {
    address: treasuryAddress,
  });

  return Promise.all(
    tokenAddresses.map((address) =>
      queryClient.ensureQueryData(
        tokenInfoOptions({
          address,
          chainId: client.chain!.id,
          client,
        }),
      ),
    ),
  );
};
