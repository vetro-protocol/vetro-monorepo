import { useRedeemDelay } from "hooks/useRedeemDelay";
import type { TokenWithGateway } from "types";
import { useAccount } from "wagmi";

import { OneStepRedeem } from "./oneStepRedeem";
import { RedeemSkeleton } from "./redeemSkeleton";
import { TwoStepRedeem } from "./twoStepRedeem";

type Props = {
  amountBigInt: bigint;
  approve10x: boolean;
  approveAmount: bigint | undefined;
  fromInputValue: string;
  fromToken: TokenWithGateway;
  onFromTokenChange: (token: TokenWithGateway) => void;
  onInputChange: (value: string) => void;
  onMaxClick: (maxValue: string) => void;
  onToggle: VoidFunction;
  onTokenChange: (token: TokenWithGateway) => void;
  onToggleApprove10x: VoidFunction;
  peggedTokens: TokenWithGateway[];
  toToken: TokenWithGateway;
  whitelistedTokens: TokenWithGateway[];
};

export function Redeem(props: Props) {
  const { address } = useAccount();
  const { data: redeemDelay, isLoading } = useRedeemDelay(
    props.fromToken.gatewayAddress,
  );

  // If disconnected, show the most common case which is the 2-step redeem
  if (!address) {
    return <TwoStepRedeem {...props} />;
  }

  if (isLoading) {
    return <RedeemSkeleton fromToken={props.fromToken} />;
  }

  const hasDelay = redeemDelay !== undefined && redeemDelay > 0n;

  return hasDelay ? <TwoStepRedeem {...props} /> : <OneStepRedeem {...props} />;
}
