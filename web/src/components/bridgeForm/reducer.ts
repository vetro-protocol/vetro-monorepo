import type { BridgeableToken } from "types";
import { sanitizeAmount } from "utils/sanitizeAmount";

export type BridgeFormState = {
  approve10x: boolean;
  fromInputValue: string;
  fromToken: BridgeableToken;
  toToken: BridgeableToken;
};

export type BridgeFormAction =
  | { payload: string; type: "SET_FROM_INPUT_VALUE" }
  | { payload: BridgeableToken; type: "SET_FROM_TOKEN" }
  | { payload: BridgeableToken; type: "SET_TO_TOKEN" }
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
    case "SET_FROM_TOKEN":
      return { ...state, fromToken: action.payload };
    case "SET_TO_TOKEN":
      return { ...state, toToken: action.payload };
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
