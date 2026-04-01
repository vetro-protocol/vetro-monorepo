import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { tokenConfigOptions } from "hooks/useTokenConfig";
import { whitelistedTokensOptions } from "hooks/useWhitelistedTokens";
import { type Client, formatUnits } from "viem";
import { readContract } from "viem/actions";

const aggregatorV3Abi = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [{ internalType: "int256", name: "", type: "int256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const fetchOraclePrices = async function ({
  client,
  queryClient,
}: {
  client: Client;
  queryClient: QueryClient;
}) {
  const chainId = client.chain!.id;
  const gatewayAddress = getGatewayAddress(chainId);

  const whitelistedTokens = await queryClient.ensureQueryData(
    whitelistedTokensOptions({ client, queryClient }),
  );

  const entries = await Promise.all(
    whitelistedTokens.map(async function (token) {
      const { oracle } = await queryClient.ensureQueryData(
        tokenConfigOptions({
          chainId,
          client,
          gatewayAddress,
          queryClient,
          token: token.address,
        }),
      );

      const [latestAnswer, decimals] = await Promise.all([
        readContract(client, {
          abi: aggregatorV3Abi,
          address: oracle,
          functionName: "latestAnswer",
        }),
        readContract(client, {
          abi: aggregatorV3Abi,
          address: oracle,
          functionName: "decimals",
        }),
      ]);

      const key = (token.extensions?.priceSymbol ?? token.symbol).toUpperCase();
      return [key, formatUnits(latestAnswer, decimals)] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<string, string>;
};
