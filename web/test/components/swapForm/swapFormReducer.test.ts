import { describe, expect, it } from "vitest";

import { swapFormReducer } from "../../../src/components/swapForm/swapFormReducer";
import type { SwapFormState } from "../../../src/components/swapForm/types";

const mockToken1 = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
  chainId: 1,
  decimals: 6,
  logoURI: "https://example.com/usdc.svg",
  name: "USD Coin",
  symbol: "USDC",
};

const mockToken2 = {
  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as const,
  chainId: 1,
  decimals: 6,
  logoURI: "https://example.com/usdt.svg",
  name: "Tether USD",
  symbol: "USDT",
};

const createInitialState = (): SwapFormState => ({
  fromInputValue: "0",
  fromToken: mockToken1,
  toToken: mockToken2,
});

describe("swapFormReducer", function () {
  it("SET_FROM_INPUT_VALUE updates value when valid", function () {
    const state = createInitialState();
    const result = swapFormReducer(state, {
      payload: "123.45",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("123.45");
  });

  it("SET_FROM_INPUT_VALUE ignores invalid input", function () {
    const state = createInitialState();
    const result = swapFormReducer(state, {
      payload: "abc",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("0");
  });

  it("SET_FROM_INPUT_VALUE sanitizes input with leading zeros", function () {
    const state = createInitialState();
    const result = swapFormReducer(state, {
      payload: "0123",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("123");
  });

  it("SET_FROM_INPUT_VALUE handles empty input as zero", function () {
    const state = { ...createInitialState(), fromInputValue: "100" };
    const result = swapFormReducer(state, {
      payload: "",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("0");
  });

  it("SET_FROM_TOKEN changes source token", function () {
    const state = createInitialState();
    const newToken = { ...mockToken2, symbol: "NEW" };
    const result = swapFormReducer(state, {
      payload: newToken,
      type: "SET_FROM_TOKEN",
    });
    expect(result.fromToken).toBe(newToken);
    expect(result.toToken).toBe(mockToken2);
  });

  it("SET_TO_TOKEN changes target token", function () {
    const state = createInitialState();
    const newToken = { ...mockToken1, symbol: "NEW" };
    const result = swapFormReducer(state, {
      payload: newToken,
      type: "SET_TO_TOKEN",
    });
    expect(result.toToken).toBe(newToken);
    expect(result.fromToken).toBe(mockToken1);
  });

  it("TOGGLE_TOKENS swaps tokens and preserves input value", function () {
    const state = {
      ...createInitialState(),
      fromInputValue: "500",
    };
    const result = swapFormReducer(state, { type: "TOGGLE_TOKENS" });
    expect(result.fromToken).toBe(mockToken2);
    expect(result.toToken).toBe(mockToken1);
    expect(result.fromInputValue).toBe("500");
  });

  it("returns unchanged state for unknown action", function () {
    const state = createInitialState();
    // @ts-expect-error Testing unknown action type
    const result = swapFormReducer(state, { type: "UNKNOWN_ACTION" });
    expect(result).toBe(state);
  });
});
