import type { QueryClient } from "@tanstack/react-query";
import { getMaxWithdraw } from "@vetro-protocol/gateway/actions";
import { whitelistedTokensOptions } from "hooks/useWhitelistedTokens";
import type { Address, Client } from "viem";

export const fetchTreasuryReserves = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) {
  const tokens = await queryClient.ensureQueryData(
    whitelistedTokensOptions({
      client,
      gatewayAddress,
      queryClient,
    }),
  );

  const amounts = await Promise.all(
    tokens.map((token) =>
      getMaxWithdraw(client, {
        address: gatewayAddress,
        tokenOut: token.address,
      }),
    ),
  );

  return tokens.map((token, i) => ({
    amount: amounts[i],
    token,
  }));
};
