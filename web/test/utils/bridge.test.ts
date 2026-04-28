import type { BridgeableToken } from "types";
import { describe, expect, it } from "vitest";

import { pickCounterpartToken } from "../../src/utils/bridge";

const makeToken = (symbol: string, chainId: number): BridgeableToken =>
  ({
    chainId,
    symbol,
  }) as BridgeableToken;

describe("pickCounterpartToken", function () {
  it("picks a token with the same symbol on a different chain", function () {
    const token = makeToken("VUSD", 1);
    const otherChain = makeToken("VUSD", 42161);
    expect(pickCounterpartToken({ token, tokens: [token, otherChain] })).toBe(
      otherChain,
    );
  });

  it("skips same-chain tokens even when symbol matches", function () {
    const token = makeToken("VUSD", 1);
    const sameChain = makeToken("VUSD", 1);
    const otherChain = makeToken("VUSD", 8453);
    expect(
      pickCounterpartToken({ token, tokens: [sameChain, otherChain] }),
    ).toBe(otherChain);
  });

  it("skips different-symbol tokens even on a different chain", function () {
    const token = makeToken("VUSD", 1);
    const differentSymbol = makeToken("vetBTC", 42161);
    const match = makeToken("VUSD", 8453);
    expect(
      pickCounterpartToken({ token, tokens: [differentSymbol, match] }),
    ).toBe(match);
  });

  it("returns the first eligible match when multiple exist", function () {
    const token = makeToken("VUSD", 1);
    const first = makeToken("VUSD", 42161);
    const second = makeToken("VUSD", 8453);
    expect(pickCounterpartToken({ token, tokens: [first, second] })).toBe(
      first,
    );
  });

  it("falls back to tokens[0] when no eligible match exists", function () {
    const token = makeToken("VUSD", 1);
    const sameChain = makeToken("VUSD", 1);
    const differentSymbol = makeToken("vetBTC", 42161);
    expect(
      pickCounterpartToken({ token, tokens: [sameChain, differentSymbol] }),
    ).toBe(sameChain);
  });
});
