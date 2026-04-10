import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { type ComponentProps, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import type { Address } from "viem";

import type { UnitPreview } from "./outputLabel";
import type { SwapFees } from "./swapFees";

const SwapProgressDrawer = lazy(() =>
  import("./swapProgressDrawer").then((m) => ({
    default: m.SwapProgressDrawer,
  })),
);

export type RedeemFlowStatus =
  | "approve-error"
  | "approved"
  | "approving"
  | "idle"
  | "redeem-error"
  | "redeem-ready"
  | "redeemed"
  | "redeeming";

const approveStepStatuses: Record<
  Exclude<RedeemFlowStatus, "idle">,
  Step["status"]
> = {
  "approve-error": stepStatus.failed,
  approved: stepStatus.completed,
  approving: stepStatus.progress,
  "redeem-error": stepStatus.completed,
  "redeem-ready": stepStatus.completed,
  redeemed: stepStatus.completed,
  redeeming: stepStatus.completed,
};

const confirmStepStatuses: Record<
  Exclude<RedeemFlowStatus, "idle">,
  Step["status"]
> = {
  "approve-error": stepStatus.notReady,
  approved: stepStatus.notReady,
  approving: stepStatus.notReady,
  "redeem-error": stepStatus.failed,
  "redeem-ready": stepStatus.ready,
  redeemed: stepStatus.completed,
  redeeming: stepStatus.progress,
};

type Props = {
  flowStatus: Exclude<RedeemFlowStatus, "idle">;
  fromAmount: string;
  fromToken: Token;
  onClose: VoidFunction;
  onRetry: VoidFunction;
  oracleToken: Address;
  outputValue: string;
  showApproveStep: boolean;
  toToken: Token;
  unitPreview: UnitPreview;
} & Pick<
  ComponentProps<typeof SwapFees>,
  "networkFee" | "protocolFee" | "totalFees"
>;

export function SwapRedeemDrawer({
  flowStatus,
  fromAmount,
  fromToken,
  networkFee,
  onClose,
  onRetry,
  oracleToken,
  outputValue,
  protocolFee,
  showApproveStep,
  totalFees,
  toToken,
  unitPreview,
}: Props) {
  const { t } = useTranslation();
  useCloseOnSuccess({ onClose, success: flowStatus === "redeemed" });

  const isError =
    flowStatus === "approve-error" || flowStatus === "redeem-error";

  const steps: Step[] = [
    {
      description: t("pages.swap.progress.confirm-description"),
      status: confirmStepStatuses[flowStatus],
      title: t("pages.swap.progress.confirm-title"),
    },
  ];

  if (showApproveStep) {
    steps.unshift({
      description: t("pages.swap.progress.approve-description"),
      status: approveStepStatuses[flowStatus],
      title: t("pages.swap.progress.approve-title"),
    });
  }

  return (
    <Drawer onClose={onClose}>
      <Suspense fallback={<DrawerLoader />}>
        <SwapProgressDrawer
          fromAmount={fromAmount}
          fromToken={fromToken}
          networkFee={networkFee}
          onRetry={isError ? onRetry : undefined}
          oracleToken={oracleToken}
          outputValue={outputValue}
          protocolFee={protocolFee}
          steps={steps}
          toToken={toToken}
          totalFees={totalFees}
          unitPreview={unitPreview}
        />
      </Suspense>
    </Drawer>
  );
}
