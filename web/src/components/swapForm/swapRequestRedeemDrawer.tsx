import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { type ReactNode, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

const SwapProgressDrawer = lazy(() =>
  import("./swapProgressDrawer").then((m) => ({
    default: m.SwapProgressDrawer,
  })),
);

export type RequestRedeemFlowStatus =
  | "approve-error"
  | "approved"
  | "approving"
  | "idle"
  | "request-redeem-error"
  | "request-redeem-ready"
  | "request-redeemed"
  | "request-redeeming";

const approveStepStatuses: Record<
  Exclude<RequestRedeemFlowStatus, "idle">,
  Step["status"]
> = {
  "approve-error": stepStatus.failed,
  approved: stepStatus.completed,
  approving: stepStatus.progress,
  "request-redeem-error": stepStatus.completed,
  "request-redeem-ready": stepStatus.completed,
  "request-redeemed": stepStatus.completed,
  "request-redeeming": stepStatus.completed,
};

const confirmStepStatuses: Record<
  Exclude<RequestRedeemFlowStatus, "idle">,
  Step["status"]
> = {
  "approve-error": stepStatus.notReady,
  approved: stepStatus.notReady,
  approving: stepStatus.notReady,
  "request-redeem-error": stepStatus.failed,
  "request-redeem-ready": stepStatus.ready,
  "request-redeemed": stepStatus.completed,
  "request-redeeming": stepStatus.progress,
};

type Props = {
  flowStatus: Exclude<RequestRedeemFlowStatus, "idle">;
  fromAmount: string;
  fromToken: Token;
  networkFee: string;
  onClose: VoidFunction;
  onRetry: VoidFunction;
  protocolFee: string;
  showApproveStep: boolean;
  subtitle: ReactNode;
  totalFees: string;
};

export function SwapRequestRedeemDrawer({
  flowStatus,
  fromAmount,
  fromToken,
  networkFee,
  onClose,
  onRetry,
  protocolFee,
  showApproveStep,
  subtitle,
  totalFees,
}: Props) {
  const { t } = useTranslation();
  useCloseOnSuccess({ onClose, success: flowStatus === "request-redeemed" });

  const isError =
    flowStatus === "approve-error" || flowStatus === "request-redeem-error";

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
          protocolFee={protocolFee}
          steps={steps}
          subtitle={subtitle}
          totalFees={totalFees}
        />
      </Suspense>
    </Drawer>
  );
}
