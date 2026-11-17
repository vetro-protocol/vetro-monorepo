import { gateways, knownTokens } from "@vetro-protocol/core";
import { getTokenConfig } from "@vetro-protocol/treasury/actions";
import { type Address, type Client, formatUnits, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

import { getLatestPrice } from "../chainlink.ts";
import { getUsdPrices } from "../portal-prices.ts";

import { pegUsdPrice } from "./portal-usd-price.ts";

const oraclePegPrice = async function ({
  client,
  token,
  treasury,
}: {
  client: Client;
  token: Address;
  treasury: Address;
}) {
  const [, oracle] = await getTokenConfig(client, { address: treasury, token });
  const { decimals, price } = await getLatestPrice({ address: oracle, client });
  return price > 0n ? Number(formatUnits(price, decimals)) : undefined;
};

const readOraclePegPrices = (client: Client) =>
  Promise.all(
    gateways.flatMap((gateway) =>
      gateway.whitelistedTokens.map(async function (address) {
        const symbol = knownTokens
          .find(
            (known) =>
              known.chainId === mainnet.id &&
              isAddressEqual(known.address, address),
          )
          ?.symbol.toUpperCase();
        if (symbol === undefined) {
          return undefined;
        }
        const pegPrice = await oraclePegPrice({
          client,
          token: address,
          treasury: gateway.treasury,
        }).catch(function (error) {
          console.warn(
            `Failed to read the oracle price of ${address}: ${error.message}`,
          );
          return undefined;
        });
        return pegPrice === undefined
          ? undefined
          : { pegBaseSymbol: gateway.pegBaseSymbol, pegPrice, symbol };
      }),
    ),
  );

/**
 * Set the USD price of each whitelisted token from its Treasury oracle (token
 * per peg unit) times the USD price of the peg unit. The oracle price wins
 * over the portal price, and the portal price is kept when the oracle read
 * fails. The oracle reads run while the portal prices load.
 */
export const withOracleUsdPrices = async function ({
  client,
  prices,
}: {
  client: Client;
  prices: Promise<Record<string, string>>;
}) {
  const [portal, oraclePrices] = await Promise.all([
    prices,
    readOraclePegPrices(client),
  ]);
  const oracleEntries = oraclePrices.flatMap(function (oraclePrice) {
    if (oraclePrice === undefined) {
      return [];
    }
    const pegUsd = pegUsdPrice({
      pegBaseSymbol: oraclePrice.pegBaseSymbol,
      prices: portal,
    });
    return pegUsd === undefined
      ? []
      : [[oraclePrice.symbol, String(oraclePrice.pegPrice * pegUsd)] as const];
  });
  return { ...portal, ...Object.fromEntries(oracleEntries) };
};

export const getLiquidityUsdPrices = ({
  client,
  portalApiUrl,
}: {
  client: Client;
  portalApiUrl: string;
}) =>
  withOracleUsdPrices({
    client,
    prices: getUsdPrices(portalApiUrl).catch(function (error) {
      console.warn(`Failed to get USD prices: ${error.message}`);
      return {};
    }),
  });
