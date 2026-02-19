import type { Token } from "types";
import { describe, expect, it } from "vitest";

import { getTokenListParams } from "../../src/utils/tokenList";

const makeToken = (symbol: string) =>
  ({
    symbol,
  }) as Token;

describe("getTokenListParams", function () {
  it("should handle a single token", function () {
    expect(getTokenListParams([makeToken("USDC")])).toEqual({
      allButLast: "",
      count: 1,
      firstSymbol: "USDC",
      lastSymbol: "USDC",
    });
  });

  it("should handle two tokens", function () {
    expect(getTokenListParams([makeToken("USDC"), makeToken("USDT")])).toEqual({
      allButLast: "USDC",
      count: 2,
      firstSymbol: "USDC",
      lastSymbol: "USDT",
    });
  });

  it("should handle three tokens", function () {
    expect(
      getTokenListParams([
        makeToken("USDC"),
        makeToken("USDT"),
        makeToken("DAI"),
      ]),
    ).toEqual({
      allButLast: "USDC, USDT",
      count: 3,
      firstSymbol: "USDC",
      lastSymbol: "DAI",
    });
  });
});
