import { sanitizeAmount } from "utils/sanitizeAmount";

import type { StakeFormState, StakeMode } from "./types";

export type StakeAction =
  | { payload: string; type: "SET_INPUT_VALUE" }
  | { payload: StakeMode; type: "SET_MODE" };

export function stakeReducer(
  state: StakeFormState,
  action: StakeAction,
): StakeFormState {
  switch (action.type) {
    case "SET_INPUT_VALUE": {
      const result = sanitizeAmount(action.payload);
      if ("error" in result) {
        return state;
      }
      return { ...state, inputValue: result.value };
    }
    case "SET_MODE":
      return { ...state, mode: action.payload };
    default:
      return state;
  }
}
