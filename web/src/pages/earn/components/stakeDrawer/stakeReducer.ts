import { sanitizeAmount } from "utils/sanitizeAmount";

import type { StakeFormState } from "./types";

export type StakeAction = { payload: string; type: "SET_INPUT_VALUE" };

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
    default:
      return state;
  }
}
