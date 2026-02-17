import { useRedeemDelay } from "hooks/useRedeemDelay";
import type { Token } from "types";
import { useAccount } from "wagmi";

import { OneStepRedeem } from "./oneStepRedeem";
import { TwoStepRedeem } from "./twoStepRedeem";

type Props = {
  amountBigInt: bigint;
  approve10x: boolean;
  approveAmount: bigint | undefined;
  fromInputValue: string;
  fromToken: Token;
  onInputChange: (value: string) => void;
  onMaxClick: (maxValue: string) => void;
  onToggle: VoidFunction;
  onTokenChange: (token: Token) => void;
  onToggleApprove10x: VoidFunction;
  toToken: Token;
  whitelistedTokens: Token[];
};

export function Redeem(props: Props) {
  const { address } = useAccount();
  const { data: redeemDelay, isLoading } = useRedeemDelay();

  // If disconnected, show the most common case which is the 2-step redeem
  if (!address) {
    return <TwoStepRedeem {...props} />;
  }

  if (isLoading) {
    // TODO: proper loading state to be added later
    return "...";
  }

  const hasDelay = redeemDelay !== undefined && redeemDelay > 0n;

  return hasDelay ? <TwoStepRedeem {...props} /> : <OneStepRedeem {...props} />;
}
