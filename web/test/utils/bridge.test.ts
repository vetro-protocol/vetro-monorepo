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

  it("preserves the current counterpart when it is still valid", function () {
    const token = makeToken("VUSD", 1);
    const current = makeToken("VUSD", 8453);
    const otherChain = makeToken("VUSD", 42161);
    expect(
      pickCounterpartToken({
        current,
        token,
        tokens: [otherChain, current],
      }),
    ).toBe(current);
  });

  it("re-picks when the current counterpart's symbol no longer matches", function () {
    const token = makeToken("sVUSD", 42161);
    const current = makeToken("VUSD", 8453);
    const match = makeToken("sVUSD", 1);
    expect(
      pickCounterpartToken({ current, token, tokens: [current, match] }),
    ).toBe(match);
  });

  it("re-picks when the current counterpart is on the same chain as the source", function () {
    const token = makeToken("VUSD", 8453);
    const current = makeToken("VUSD", 8453);
    const match = makeToken("VUSD", 42161);
    expect(
      pickCounterpartToken({ current, token, tokens: [current, match] }),
    ).toBe(match);
  });
});
