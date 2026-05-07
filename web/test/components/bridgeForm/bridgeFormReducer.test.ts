import type { BridgeableToken } from "types";
import { describe, expect, it } from "vitest";

import {
  type BridgeFormState,
  bridgeFormReducer,
} from "../../../src/components/bridgeForm/reducer";

const mockToken1: BridgeableToken = {
  address: "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
  chainId: 1,
  decimals: 18,
  logoURI: "https://example.com/vusd.svg",
  name: "Vetro USD",
  oftAdapterAddress: "0xFc8Acf5ef1E8839Ec94151740CfEd95D7E579Afb",
  symbol: "VUSD",
};

const mockToken2: BridgeableToken = {
  address: "0xCE2c108fB49551f6d27BBb529Ad1938835ac3574",
  chainId: 42161,
  decimals: 18,
  logoURI: "https://example.com/vusd.svg",
  name: "Vetro USD",
  symbol: "VUSD",
};

const mockToken3: BridgeableToken = {
  address: "0x8a654093e21703afc8d038FF253A3c974C5C2957",
  chainId: 8453,
  decimals: 18,
  logoURI: "https://example.com/vusd.svg",
  name: "Vetro USD",
  symbol: "VUSD",
};

const tokens = [mockToken1, mockToken2, mockToken3];

const createInitialState = (): BridgeFormState => ({
  approve10x: false,
  fromInputValue: "0",
  fromToken: mockToken1,
  toToken: mockToken2,
});

describe("bridgeFormReducer", function () {
  it("SET_FROM_INPUT_VALUE updates value when valid", function () {
    const state = createInitialState();
    const result = bridgeFormReducer(state, {
      payload: "123.45",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("123.45");
  });

  it("SET_FROM_INPUT_VALUE ignores invalid input", function () {
    const state = createInitialState();
    const result = bridgeFormReducer(state, {
      payload: "abc",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("0");
  });

  it("SET_FROM_INPUT_VALUE sanitizes input with leading zeros", function () {
    const state = createInitialState();
    const result = bridgeFormReducer(state, {
      payload: "0123",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("123");
  });

  it("SET_FROM_INPUT_VALUE handles empty input as zero", function () {
    const state = { ...createInitialState(), fromInputValue: "100" };
    const result = bridgeFormReducer(state, {
      payload: "",
      type: "SET_FROM_INPUT_VALUE",
    });
    expect(result.fromInputValue).toBe("0");
  });

  it("SET_FROM_TOKEN changes source token when chains do not conflict", function () {
    const state = createInitialState();
    const result = bridgeFormReducer(state, {
      payload: { token: mockToken3, tokens },
      type: "SET_FROM_TOKEN",
    });
    expect(result.fromToken).toBe(mockToken3);
    expect(result.toToken).toBe(mockToken2);
  });

  it("SET_FROM_TOKEN picks a counterpart for toToken when chains conflict", function () {
    const state = createInitialState();
    // mockToken2 lives on the same chain as the current toToken (also mockToken2).
    const result = bridgeFormReducer(state, {
      payload: { token: mockToken2, tokens },
      type: "SET_FROM_TOKEN",
    });
    expect(result.fromToken).toBe(mockToken2);
    // toToken must be reassigned to a token on a different chain.
    expect(result.toToken.chainId).not.toBe(mockToken2.chainId);
    expect(result.toToken.symbol).toBe(mockToken2.symbol);
  });

  it("SET_TO_TOKEN changes target token when chains do not conflict", function () {
    const state = createInitialState();
    const result = bridgeFormReducer(state, {
      payload: { token: mockToken3, tokens },
      type: "SET_TO_TOKEN",
    });
    expect(result.toToken).toBe(mockToken3);
    expect(result.fromToken).toBe(mockToken1);
  });

  it("SET_TO_TOKEN picks a counterpart for fromToken when chains conflict", function () {
    const state = createInitialState();
    // mockToken1 lives on the same chain as the current fromToken (also mockToken1).
    const result = bridgeFormReducer(state, {
      payload: { token: mockToken1, tokens },
      type: "SET_TO_TOKEN",
    });
    expect(result.toToken).toBe(mockToken1);
    expect(result.fromToken.chainId).not.toBe(mockToken1.chainId);
    expect(result.fromToken.symbol).toBe(mockToken1.symbol);
  });

  it("TOGGLE_TOKENS swaps tokens and preserves input value", function () {
    const state = {
      ...createInitialState(),
      fromInputValue: "500",
    };
    const result = bridgeFormReducer(state, { type: "TOGGLE_TOKENS" });
    expect(result.fromToken).toBe(mockToken2);
    expect(result.toToken).toBe(mockToken1);
    expect(result.fromInputValue).toBe("500");
  });

  it("TOGGLE_APPROVE_10X toggles approve10x from false to true", function () {
    const state = createInitialState();
    const result = bridgeFormReducer(state, { type: "TOGGLE_APPROVE_10X" });
    expect(result.approve10x).toBe(true);
  });

  it("TOGGLE_APPROVE_10X toggles approve10x from true to false", function () {
    const state = { ...createInitialState(), approve10x: true };
    const result = bridgeFormReducer(state, { type: "TOGGLE_APPROVE_10X" });
    expect(result.approve10x).toBe(false);
  });

  it("returns unchanged state for unknown action", function () {
    const state = createInitialState();
    // @ts-expect-error Testing unknown action type
    const result = bridgeFormReducer(state, { type: "UNKNOWN_ACTION" });
    expect(result).toBe(state);
  });
});
