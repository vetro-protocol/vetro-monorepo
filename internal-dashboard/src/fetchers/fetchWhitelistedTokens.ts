import { gateways } from "@vetro-protocol/gateway";
import { getPeggedToken, getTreasury } from "@vetro-protocol/gateway/actions";
import { getWhitelistedTokens } from "@vetro-protocol/treasury/actions";
import { getAddress } from "viem";
import { decimals, symbol } from "viem-erc20/actions";

import { client } from "../lib/client";
import { type WhitelistedToken } from "../lib/types";

// Discovers the collateral each gateway accepts on-chain: gateway → treasury →
// whitelisted tokens. Together with the tracked tokens these form the token
// universe the Uniswap pool discovery pairs up (see fetchers/fetchUniswapPools);
// they're the pools' counterparty legs, like the WBTC in vetBTC/WBTC. Each token
// also carries its gateway's pegged token (as peggedTokenAddress), since the
// pegged token is pegged 1:1 to its whitelist: these pairs are the peg
// counterparties for the exchange-rate hint.
export const fetchWhitelistedTokens = async function (): Promise<
  WhitelistedToken[]
> {
  const perGateway = await Promise.all(
    gateways.map(async function (gateway) {
      const [peggedToken, treasury] = await Promise.all([
        getPeggedToken(client, { address: gateway.address }),
        getTreasury(client, { address: gateway.address }),
      ]);
      const peggedTokenAddress = getAddress(peggedToken);
      const tokens = await getWhitelistedTokens(client, {
        address: getAddress(treasury),
      });
      return Promise.all(
        tokens.map(async function (token) {
          const address = getAddress(token);
          const [tokenDecimals, tokenSymbol] = await Promise.all([
            decimals(client, { address }),
            symbol(client, { address }),
          ]);
          return {
            address,
            decimals: tokenDecimals,
            peggedTokenAddress,
            symbol: tokenSymbol,
          } satisfies WhitelistedToken;
        }),
      );
    }),
  );

  return perGateway.flat();
};
