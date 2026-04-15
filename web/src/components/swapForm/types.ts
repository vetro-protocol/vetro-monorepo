import type { TokenWithGateway } from "types";

export type SwapFormState = {
  approve10x: boolean;
  fromInputValue: string;
  fromToken: TokenWithGateway;
  toToken: TokenWithGateway;
};
