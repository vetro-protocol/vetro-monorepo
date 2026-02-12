import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import { Suspense, lazy, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

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
  "approve-error": stepStatus.ready,
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
  "deposit-error": stepStatus.ready,
  "deposit-ready": stepStatus.ready,
  deposited: stepStatus.completed,
  depositing: stepStatus.progress,
};

type Props = {
  flowStatus: Exclude<DepositFlowStatus, "idle">;
  fromAmount: string;
  fromToken: Token;
  networkFee: string;
  onClose: VoidFunction;
  outputValue: string;
  protocolFee: string;
  showApproveStep: boolean;
  toToken: Token;
  totalFees: string;
};

export function SwapDepositDrawer({
  flowStatus,
  fromAmount,
  fromToken,
  networkFee,
  onClose,
  outputValue,
  protocolFee,
  showApproveStep,
  totalFees,
  toToken,
}: Props) {
  const { t } = useTranslation();
  useEffect(
    function closeDrawerOnSuccess() {
      if (flowStatus !== "deposited") {
        return undefined;
      }
      const timeoutId = setTimeout(onClose, 3000);
      return () => clearTimeout(timeoutId);
    },
    [flowStatus, onClose],
  );

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
