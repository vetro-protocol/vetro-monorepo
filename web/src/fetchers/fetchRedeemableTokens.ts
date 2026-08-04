import type { QueryClient } from "@tanstack/react-query";
import { tokenConfigOptions } from "hooks/useTokenConfig";
import { whitelistedTokensByGatewayOptions } from "hooks/useWhitelistedTokensByGateway";
import type { TokenWithGateway } from "types";
import type { Address, Client } from "viem";

export const fetchRedeemableTokens = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}): Promise<TokenWithGateway[]> {
  const whitelistedTokens = await queryClient.ensureQueryData(
    whitelistedTokensByGatewayOptions({
      client,
      gatewayAddress,
      queryClient,
    }),
  );

  const tokenConfigs = await Promise.all(
    whitelistedTokens.map((token) =>
      queryClient.ensureQueryData(
        tokenConfigOptions({
          chainId: client.chain!.id,
          client,
          gatewayAddress,
          queryClient,
          token: token.address,
        }),
      ),
    ),
  );

  return whitelistedTokens.filter(
    (_, index) => tokenConfigs[index].withdrawActive,
  );
};
