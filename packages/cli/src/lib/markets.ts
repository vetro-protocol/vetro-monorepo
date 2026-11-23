import {
  marketIds,
  morphoBlueAddress,
} from "@vetro-protocol/morpho-blue-market";
import { getMarketParams } from "@vetro-protocol/morpho-blue-market/actions";
import { type Client, type Hash, isAddressEqual, zeroAddress } from "viem";

import { type MarketSelector } from "./args.ts";
import { isTokenMatch, readToken } from "./tokens.ts";

async function readMarket({
  client,
  marketId,
}: {
  client: Client;
  marketId: Hash;
}) {
  const { collateralToken, irm, lltv, loanToken, oracle } =
    await getMarketParams({
      address: morphoBlueAddress,
      client,
      marketId,
    });
  if (isAddressEqual(loanToken, zeroAddress)) {
    throw new Error(
      `Unknown market "${marketId}": Morpho Blue has no market with this id`,
    );
  }
  const [collateral, loan] = await Promise.all([
    readToken({ address: collateralToken, client }),
    readToken({ address: loanToken, client }),
  ]);
  return {
    collateralToken: collateral,
    irm,
    lltv,
    loanToken: loan,
    marketId,
    oracle,
    pair: `${collateral.symbol}/${loan.symbol}`,
  };
}

export const readMarkets = (client: Client) =>
  Promise.all(marketIds.map((marketId) => readMarket({ client, marketId })));

type Market = Awaited<ReturnType<typeof readMarket>>;

export function selectMarket({
  markets,
  selector,
}: {
  markets: Market[];
  selector: MarketSelector;
}) {
  const matches = markets.filter((market) =>
    selector.marketId
      ? market.marketId.toLowerCase() === selector.marketId.toLowerCase()
      : isTokenMatch({
          token: market.collateralToken,
          value: selector.collateral,
        }) && isTokenMatch({ token: market.loanToken, value: selector.loan }),
  );
  if (matches.length === 0) {
    throw new Error(
      `Not an enabled market: "${selector.value}". Enabled markets: ${markets.map((market) => `${market.pair} (${market.marketId})`).join(", ")}`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous market "${selector.value}": it matches the market ids ${matches.map((market) => market.marketId).join(", ")}. Pass one of them as --market`,
    );
  }
  return matches[0];
}

export async function resolveMarket({
  client,
  selector,
}: {
  client: Client;
  selector: MarketSelector;
}) {
  const marketId = selector.marketId
    ? marketIds.find(
        (id) => id.toLowerCase() === selector.marketId.toLowerCase(),
      )
    : undefined;
  if (marketId) {
    return readMarket({ client, marketId });
  }
  return selectMarket({ markets: await readMarkets(client), selector });
}
