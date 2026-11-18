import type { QueryClient } from "@tanstack/react-query";
import type { Gateway } from "@vetro-protocol/gateway";
import { oraclePricesOptions } from "hooks/useOraclePrices";
import { peggedTokenQueryOptions } from "hooks/usePeggedToken";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { graphPeggedToken } from "utils/protocolGraph";
import type { Address, Client } from "viem";

const pegToUsdRate = ({
  pegBaseSymbol,
  portal,
}: {
  pegBaseSymbol: string;
  portal: Record<string, string>;
}) => (pegBaseSymbol === "USD" ? 1 : Number(portal[pegBaseSymbol] ?? 0));

const oracleDictInUsd = ({
  oracle,
  pegToUsd,
}: {
  oracle: Record<string, string>;
  pegToUsd: number;
}) =>
  Object.entries(oracle).map(
    ([symbol, peggedPrice]) =>
      [symbol, String(Number(peggedPrice) * pegToUsd)] as const,
  );

const fetchPeggedTokenSymbol = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) {
  const graphToken = graphPeggedToken(gatewayAddress);
  if (graphToken) {
    return graphToken.symbol;
  }
  const token = await queryClient.ensureQueryData(
    peggedTokenQueryOptions({ client, gatewayAddress }),
  );
  return token.symbol;
};

/**
 * Builds the USD price dictionary of `usePrices`, keyed by uppercase symbol.
 * See "USD values" in `docs/DOMAIN.md` for the rules. If the portal has no
 * price for a peg unit (e.g. BTC), the tokens of that gateway get `"0"`, which
 * most consumers show as `$0`.
 */
export const fetchPrices = async function ({
  client,
  gateways,
  queryClient,
}: {
  client: Client;
  gateways: readonly Gateway[];
  queryClient: QueryClient;
}): Promise<Record<string, string>> {
  const [portal, gatewaysWithPrices] = await Promise.all([
    queryClient.ensureQueryData(tokenPricesOptions()),
    Promise.all(
      gateways.map(async function (gateway) {
        const [oracle, peggedSymbol] = await Promise.all([
          queryClient.ensureQueryData(
            oraclePricesOptions({
              client,
              gatewayAddress: gateway.address,
              queryClient,
            }),
          ),
          fetchPeggedTokenSymbol({
            client,
            gatewayAddress: gateway.address,
            queryClient,
          }),
        ]);
        return { gateway, oracle, peggedSymbol };
      }),
    ),
  ]);

  const withPegToUsd = gatewaysWithPrices.map(
    ({ gateway, oracle, peggedSymbol }) => ({
      oracle,
      peggedSymbol,
      pegToUsd: pegToUsdRate({ pegBaseSymbol: gateway.pegBaseSymbol, portal }),
    }),
  );

  return {
    ...portal,
    ...Object.fromEntries(
      withPegToUsd.flatMap(({ oracle, pegToUsd }) =>
        oracleDictInUsd({ oracle, pegToUsd }),
      ),
    ),
    ...Object.fromEntries(
      withPegToUsd.map(({ peggedSymbol, pegToUsd }) => [
        peggedSymbol.toUpperCase(),
        String(pegToUsd),
      ]),
    ),
  };
};
