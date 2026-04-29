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

  it("SET_FROM_TOKEN changes source token", function () {
    const state = createInitialState();
    const newToken: BridgeableToken = { ...mockToken2, chainId: 8453 };
    const result = bridgeFormReducer(state, {
      payload: newToken,
      type: "SET_FROM_TOKEN",
    });
    expect(result.fromToken).toBe(newToken);
    expect(result.toToken).toBe(mockToken2);
  });

  it("SET_TO_TOKEN changes target token", function () {
    const state = createInitialState();
    const newToken: BridgeableToken = { ...mockToken1, chainId: 8453 };
    const result = bridgeFormReducer(state, {
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
