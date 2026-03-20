import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { type ComponentProps, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

import type { SwapFees } from "./swapFees";

const SwapProgressDrawer = lazy(() =>
  import("./swapProgressDrawer").then((m) => ({
    default: m.SwapProgressDrawer,
  })),
);

export type DepositFlowStatus =
  | "approve-error"
  | "approved"
  | "approving"
  | "deposit-error"
  | "deposit-ready"
  | "deposited"
  | "depositing"
  | "idle";

const approveStepStatuses: Record<
  Exclude<DepositFlowStatus, "idle">,
  Step["status"]
> = {
  "approve-error": stepStatus.failed,
  approved: stepStatus.completed,
  approving: stepStatus.progress,
  "deposit-error": stepStatus.completed,
  "deposit-ready": stepStatus.completed,
  deposited: stepStatus.completed,
  depositing: stepStatus.completed,
};

const confirmStepStatuses: Record<
  Exclude<DepositFlowStatus, "idle">,
  Step["status"]
> = {
  "approve-error": stepStatus.notReady,
  approved: stepStatus.notReady,
  approving: stepStatus.notReady,
  "deposit-error": stepStatus.failed,
  "deposit-ready": stepStatus.ready,
  deposited: stepStatus.completed,
  depositing: stepStatus.progress,
};

type Props = {
  flowStatus: Exclude<DepositFlowStatus, "idle">;
  fromAmount: string;
  fromToken: Token;
  onClose: VoidFunction;
  onRetry: VoidFunction;
  outputValue: string;
  showApproveStep: boolean;
  toToken: Token;
} & Pick<
  ComponentProps<typeof SwapFees>,
  "networkFee" | "protocolFee" | "totalFees"
>;

export function SwapDepositDrawer({
  flowStatus,
  fromAmount,
  fromToken,
  networkFee,
  onClose,
  onRetry,
  outputValue,
  protocolFee,
  showApproveStep,
  totalFees,
  toToken,
}: Props) {
  const { t } = useTranslation();
  useCloseOnSuccess({ onClose, success: flowStatus === "deposited" });

  const isError =
    flowStatus === "approve-error" || flowStatus === "deposit-error";

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
          outputValue={outputValue}
          protocolFee={protocolFee}
          steps={steps}
          toToken={toToken}
          totalFees={totalFees}
        />
      </Suspense>
    </Drawer>
  );
}
