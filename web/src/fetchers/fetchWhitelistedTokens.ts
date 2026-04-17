import type { QueryClient } from "@tanstack/react-query";
import { getWhitelistedTokens } from "@vetro-protocol/treasury/actions";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import { treasuryAddressOptions } from "hooks/useTreasuryAddress";
import type { TokenWithGateway } from "types";
import type { Address, Client } from "viem";

export const fetchWhitelistedTokens = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}): Promise<TokenWithGateway[]> {
  const treasuryAddress = await queryClient.ensureQueryData(
    treasuryAddressOptions({
      chainId: client.chain!.id,
      client,
      gatewayAddress,
    }),
  );

  const tokenAddresses = await getWhitelistedTokens(client, {
    address: treasuryAddress,
  });

  return Promise.all(
    tokenAddresses.map(async function (address) {
      const token = await queryClient.ensureQueryData(
        tokenInfoOptions({
          address,
          chainId: client.chain!.id,
          client,
        }),
      );
      return { ...token, gatewayAddress };
    }),
  );
};
