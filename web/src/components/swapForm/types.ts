import type { TokenWithGateway } from "types";

export type ClaimRedeemFlowStatus =
  | "idle"
  | "redeem-error"
  | "redeem-ready"
  | "redeemed"
  | "redeeming";

export type SwapFormState = {
  approve10x: boolean;
  fromInputValue: string;
  fromToken: TokenWithGateway;
  slippage: number;
  toToken: TokenWithGateway;
};
