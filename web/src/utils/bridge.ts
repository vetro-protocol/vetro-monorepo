import type { BridgeableToken } from "types";

export const pickToToken = ({
  fromToken,
  tokens,
}: {
  fromToken: BridgeableToken;
  tokens: BridgeableToken[];
}) =>
  tokens.find(
    (token) =>
      token.symbol === fromToken.symbol && token.chainId !== fromToken.chainId,
  ) ?? tokens[0];
