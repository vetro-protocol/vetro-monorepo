import type { Token } from "types";

export const getTokenListParams = (tokens: Token[]) => ({
  allButLast: tokens
    .slice(0, -1)
    .map((t) => t.symbol)
    .join(", "),
  count: tokens.length,
  firstSymbol: tokens[0]?.symbol,
  lastSymbol: tokens.at(-1)!.symbol,
});
