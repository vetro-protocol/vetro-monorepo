import type { QueryClient } from "@tanstack/react-query";
import type { Gateway } from "@vetro-protocol/gateway";
import { oraclePricesOptions } from "hooks/useOraclePrices";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import type { Client } from "viem";

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

/**
 * Builds the merged USD price dictionary used by `usePrices`. The result is a
 * flat `Record<symbol, USD price string>` composed from two sources:
 *
 *   1. The portal API (`tokenPricesOptions`) — USD prices for arbitrary tokens
 *      keyed by uppercase symbol (BTC, WBTC, ETH, USDT, USDC, ...). This is
 *      the only source equipped to convert a gateway's peg unit (BTC, ETH) to
 *      USD. Portal entries seed the result; oracle entries override them on
 *      key collision, since the oracle is the source the protocol itself uses
 *      for mint/redeem and liquidations.
 *
 *   2. Per-gateway on-chain Chainlink oracles (`oraclePricesOptions`) — these
 *      are denominated in the *gateway's peg unit*, NOT USD (e.g. WBTC/BTC for
 *      the vetBTC gateway, USDT/USD for the VUSD gateway). Each oracle entry
 *      is converted to USD by multiplying by `portal[gateway.pegBaseSymbol]`,
 *      with `"USD"` treated as identity (×1).
 *
 * Pegged tokens themselves (vetBTC, VUSD, future vetETH) have no oracle of
 * their own; they use `extensions.priceSymbol` to point at a whitelisted proxy
 * in the same gateway (vetBTC→WBTC, VUSD→USDT, vetETH→WETH). The lookup
 * happens downstream in `utils/token.ts#getTokenPrice`.
 *
 * Failure mode: if `portal[pegBaseSymbol]` is missing, the corresponding
 * gateway's tokens resolve to `$0` in the merged dict. Consumers either
 * render that as `$0` (e.g. `RenderFiatValue`, which only shows `-` on
 * query errors, not on a zero price) or branch on it explicitly (e.g.
 * `liquidationPriceCell` shows `-` when the price is non-positive). Not
 * crash-prone, but visually misleading until the portal recovers.
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
  const [portal, gatewaysWithOracle] = await Promise.all([
    queryClient.ensureQueryData(tokenPricesOptions()),
    Promise.all(
      gateways.map(async function (gateway) {
        const oracle = await queryClient.ensureQueryData(
          oraclePricesOptions({
            client,
            gatewayAddress: gateway.address,
            queryClient,
          }),
        );
        return { gateway, oracle };
      }),
    ),
  ]);

  return {
    ...portal,
    ...Object.fromEntries(
      gatewaysWithOracle.flatMap(({ gateway, oracle }) =>
        oracleDictInUsd({
          oracle,
          pegToUsd: pegToUsdRate({
            pegBaseSymbol: gateway.pegBaseSymbol,
            portal,
          }),
        }),
      ),
    ),
  };
};
