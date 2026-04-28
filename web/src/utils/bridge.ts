import type { BridgeableToken } from "types";

export const pickCounterpartToken = ({
  token,
  tokens,
}: {
  token: BridgeableToken;
  tokens: BridgeableToken[];
}) =>
  tokens.find(
    (candidate) =>
      candidate.symbol === token.symbol && candidate.chainId !== token.chainId,
  ) ?? tokens[0];
