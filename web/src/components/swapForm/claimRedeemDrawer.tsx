import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import type { InputError } from "components/tokenInput/utils";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { type ComponentProps, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

import { type ClaimRedeemFlowStatus } from "./claimRedeemProgressDrawer";
import type { SwapFees } from "./swapFees";

const ClaimRedeemProgressDrawer = lazy(() =>
  import("./claimRedeemProgressDrawer").then((m) => ({
    default: m.ClaimRedeemProgressDrawer,
  })),
);

const confirmStepStatuses: Record<ClaimRedeemFlowStatus, Step["status"]> = {
  idle: stepStatus.notReady,
  "redeem-error": stepStatus.failed,
  "redeem-ready": stepStatus.ready,
  redeemed: stepStatus.completed,
  redeeming: stepStatus.progress,
};

type Props = {
  amountBigInt: bigint;
  amountLocked: bigint;
  flowStatus: ClaimRedeemFlowStatus;
  fromAmount: string;
  fromToken: Token;
  onClose: VoidFunction;
  onInputChange: (value: string) => void;
  onMaxClick: VoidFunction;
  onSubmit: VoidFunction;
  onTokenChange: (token: Token) => void;
  outputBigInt: bigint | undefined;
  outputValue: string;
  toToken: Token;
  inputError: InputError | undefined;
  whitelistedTokens: Token[];
} & Pick<
  ComponentProps<typeof SwapFees>,
  "networkFee" | "protocolFee" | "totalFees"
>;

export function ClaimRedeemDrawer({
  amountBigInt,
  amountLocked,
  flowStatus,
  fromAmount,
  fromToken,
  inputError,
  networkFee,
  onClose,
  onInputChange,
  onMaxClick,
  onSubmit,
  onTokenChange,
  outputBigInt,
  outputValue,
  protocolFee,
  totalFees,
  toToken,
  whitelistedTokens,
}: Props) {
  const { t } = useTranslation();
  useCloseOnSuccess({ onClose, success: flowStatus === "redeemed" });

  const isError = flowStatus === "redeem-error";

  const steps: Step[] = [
    {
      description: t("pages.swap.progress.confirm-description"),
      status: confirmStepStatuses[flowStatus],
      title: t("pages.swap.progress.confirm-title"),
    },
  ];

  return (
    <Drawer onClose={onClose}>
      <Suspense fallback={<DrawerLoader />}>
        <ClaimRedeemProgressDrawer
          amountBigInt={amountBigInt}
          amountLocked={amountLocked}
          flowStatus={flowStatus}
          fromAmount={fromAmount}
          fromToken={fromToken}
          inputError={inputError}
          networkFee={networkFee}
          onInputChange={onInputChange}
          onMaxClick={onMaxClick}
          onRetry={isError ? onSubmit : undefined}
          onSubmit={onSubmit}
          onTokenChange={onTokenChange}
          outputBigInt={outputBigInt}
          outputValue={outputValue}
          protocolFee={protocolFee}
          steps={steps}
          toToken={toToken}
          totalFees={totalFees}
          whitelistedTokens={whitelistedTokens}
        />
      </Suspense>
    </Drawer>
  );
}
