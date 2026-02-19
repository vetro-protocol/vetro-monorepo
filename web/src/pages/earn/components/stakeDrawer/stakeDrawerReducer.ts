import { sanitizeAmount } from "utils/sanitizeAmount";

export type DepositStep =
  | "approve-failed"
  | "approved"
  | "approving"
  | "completed"
  | "deposit-failed"
  | "depositing"
  | "idle";

export type WithdrawStep =
  | "completed"
  | "failed"
  | "idle"
  | "request-failed"
  | "requesting"
  | "withdrawing";

export type StakeDrawerState = {
  approve10x: boolean;
  approvalCompleted: boolean;
  depositStep: DepositStep;
  inputValue: string;
  withdrawStep: WithdrawStep;
};

export type StakeDrawerAction =
  | { payload: DepositStep; type: "SET_DEPOSIT_STEP" }
  | { payload: string; type: "SET_INPUT_VALUE" }
  | { payload: WithdrawStep; type: "SET_WITHDRAW_STEP" }
  | { type: "TOGGLE_APPROVE_10X" };

export const initialStakeDrawerState: StakeDrawerState = {
  approvalCompleted: false,
  approve10x: false,
  depositStep: "idle",
  inputValue: "0",
  withdrawStep: "idle",
};

export function stakeDrawerReducer(
  state: StakeDrawerState,
  action: StakeDrawerAction,
): StakeDrawerState {
  switch (action.type) {
    case "SET_DEPOSIT_STEP":
      return {
        ...state,
        approvalCompleted:
          state.approvalCompleted || action.payload === "approved",
        depositStep: action.payload,
      };
    case "SET_INPUT_VALUE": {
      const result = sanitizeAmount(action.payload);
      if ("error" in result) {
        return state;
      }
      return { ...state, inputValue: result.value };
    }
    case "SET_WITHDRAW_STEP":
      return { ...state, withdrawStep: action.payload };
    case "TOGGLE_APPROVE_10X":
      return { ...state, approve10x: !state.approve10x };
    default:
      return state;
  }
}
