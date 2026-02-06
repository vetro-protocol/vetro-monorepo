import type { Token } from "types";

export type SwapFormState = {
  approve10x: boolean;
  fromInputValue: string;
  fromToken: Token;
  toToken: Token;
};

export type InputError =
  | "enter-amount"
  | "insufficient-balance"
  | "insufficient-gas"
  // valid state
  | undefined;
