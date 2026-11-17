import { gateways, knownTokens } from "@vetro-protocol/core";
import { type Address, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

export const pegUsdPrice = function ({
  pegBaseSymbol,
  prices,
}: {
  pegBaseSymbol: string;
  prices: Record<string, string>;
}) {
  if (pegBaseSymbol === "USD") {
    return 1;
  }
  const price = prices[pegBaseSymbol];
  return price === undefined ? undefined : Number(price);
};

const findToken = ({
  address,
  chainId,
}: {
  address: Address;
  chainId: number;
}) =>
  knownTokens.find(
    (known) =>
      known.chainId === chainId && isAddressEqual(known.address, address),
  );

// The OFT instances of a pegged token on other chains share its symbol.
const peggedTokens = gateways.map((gateway) => ({
  pegBaseSymbol: gateway.pegBaseSymbol,
  symbol: findToken({ address: gateway.peggedToken, chainId: mainnet.id })
    ?.symbol,
}));

export const portalUsdPrice = function ({
  address,
  chainId,
  prices,
}: {
  address: Address;
  chainId: number;
  prices: Record<string, string>;
}) {
  const token = findToken({ address, chainId });
  if (token === undefined) {
    return undefined;
  }
  const peggedToken = peggedTokens.find(
    ({ symbol }) => symbol === token.symbol,
  );
  if (peggedToken) {
    return pegUsdPrice({ pegBaseSymbol: peggedToken.pegBaseSymbol, prices });
  }
  const price =
    prices[(token.extensions?.priceSymbol ?? token.symbol).toUpperCase()];
  return price === undefined ? undefined : Number(price);
};
