import type { BridgeableToken } from "types";
import { pickCounterpartToken } from "utils/bridge";
import { sanitizeAmount } from "utils/sanitizeAmount";

export type BridgeFormState = {
  approve10x: boolean;
  fromInputValue: string;
  fromToken: BridgeableToken;
  toToken: BridgeableToken;
};

type SetTokenPayload = {
  token: BridgeableToken;
  tokens: BridgeableToken[];
};

type BridgeFormAction =
  | { payload: SetTokenPayload; type: "SET_FROM_TOKEN" }
  | { payload: SetTokenPayload; type: "SET_TO_TOKEN" }
  | { payload: string; type: "SET_FROM_INPUT_VALUE" }
  | { type: "TOGGLE_APPROVE_10X" }
  | { type: "TOGGLE_TOKENS" };

export function bridgeFormReducer(
  state: BridgeFormState,
  action: BridgeFormAction,
): BridgeFormState {
  switch (action.type) {
    case "SET_FROM_INPUT_VALUE": {
      const result = sanitizeAmount(action.payload);
      if ("error" in result) {
        return state;
      }
      return { ...state, fromInputValue: result.value };
    }
    case "SET_FROM_TOKEN": {
      const { token, tokens } = action.payload;
      if (token.chainId === state.toToken.chainId) {
        return {
          ...state,
          fromToken: token,
          toToken: pickCounterpartToken({ token, tokens }),
        };
      }
      return { ...state, fromToken: token };
    }
    case "SET_TO_TOKEN": {
      const { token, tokens } = action.payload;
      if (token.chainId === state.fromToken.chainId) {
        return {
          ...state,
          fromToken: pickCounterpartToken({ token, tokens }),
          toToken: token,
        };
      }
      return { ...state, toToken: token };
    }
    case "TOGGLE_APPROVE_10X":
      return { ...state, approve10x: !state.approve10x };
    case "TOGGLE_TOKENS":
      return {
        ...state,
        fromToken: state.toToken,
        toToken: state.fromToken,
      };
    default:
      return state;
  }
}
