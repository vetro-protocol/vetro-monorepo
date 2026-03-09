import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import type { Hash } from "viem";

const BorrowProgressDrawer = lazy(() =>
  import("./borrowProgressDrawer").then((m) => ({
    default: m.BorrowProgressDrawer,
  })),
);

export type BorrowFlowStatus =
  | "approve-error"
  | "approved"
  | "approving"
  | "borrow-error"
  | "borrowed"
  | "borrowing"
  | "idle"
  | "supply-collateral-error"
  | "supply-collateral-ready"
  | "supplied-collateral"
  | "supplying-collateral";

const getApproveStepStatus = function (
  status: Exclude<BorrowFlowStatus, "idle">,
): Step["status"] {
  const exceptions: Partial<
    Record<Exclude<BorrowFlowStatus, "idle">, Step["status"]>
  > = {
    "approve-error": stepStatus.failed,
    approving: stepStatus.progress,
  };
  return exceptions[status] ?? stepStatus.completed;
};

const getSupplyCollateralStepStatus = function (
  status: Exclude<BorrowFlowStatus, "idle">,
): Step["status"] {
  const exceptions: Partial<
    Record<Exclude<BorrowFlowStatus, "idle">, Step["status"]>
  > = {
    "approve-error": stepStatus.notReady,
    approved: stepStatus.notReady,
    approving: stepStatus.notReady,
    "supply-collateral-error": stepStatus.failed,
    "supply-collateral-ready": stepStatus.ready,
    "supplying-collateral": stepStatus.progress,
  };
  return exceptions[status] ?? stepStatus.completed;
};

const getBorrowStepStatus = function (
  status: Exclude<BorrowFlowStatus, "idle">,
): Step["status"] {
  const exceptions: Partial<
    Record<Exclude<BorrowFlowStatus, "idle">, Step["status"]>
  > = {
    "borrow-error": stepStatus.failed,
    borrowed: stepStatus.completed,
    borrowing: stepStatus.progress,
  };
  return exceptions[status] ?? stepStatus.notReady;
};

type Props = {
  borrowAmount: string;
  borrowToken: Token;
  collateralAmount: string;
  collateralToken: Token;
  flowStatus: Exclude<BorrowFlowStatus, "idle">;
  marketId: Hash;
  onClose: VoidFunction;
  onRetry: VoidFunction;
  showApproveStep: boolean;
};

export function BorrowDrawer({
  borrowAmount,
  borrowToken,
  collateralAmount,
  collateralToken,
  flowStatus,
  marketId,
  onClose,
  onRetry,
  showApproveStep,
}: Props) {
  const { t } = useTranslation();
  useCloseOnSuccess({ onClose, success: flowStatus === "borrowed" });

  const isError =
    flowStatus === "approve-error" ||
    flowStatus === "borrow-error" ||
    flowStatus === "supply-collateral-error";

  const steps: Step[] = [
    {
      description: t("pages.borrow.progress.supply-collateral-description"),
      status: showApproveStep
        ? getSupplyCollateralStepStatus(flowStatus)
        : getApproveStepStatus(flowStatus),
      title: t("pages.borrow.progress.supply-collateral-title"),
    },
    {
      description: t("pages.borrow.progress.confirm-description"),
      status: getBorrowStepStatus(flowStatus),
      title: t("pages.borrow.progress.confirm-title"),
    },
  ];

  if (showApproveStep) {
    steps.unshift({
      description: t("pages.borrow.progress.approve-description"),
      status: getApproveStepStatus(flowStatus),
      title: t("pages.borrow.progress.approve-title"),
    });
  }

  return (
    <Drawer onClose={onClose}>
      <Suspense fallback={<DrawerLoader />}>
        <BorrowProgressDrawer
          borrowAmount={borrowAmount}
          borrowToken={borrowToken}
          collateralAmount={collateralAmount}
          collateralToken={collateralToken}
          marketId={marketId}
          onRetry={isError ? onRetry : undefined}
          steps={steps}
        />
      </Suspense>
    </Drawer>
  );
}
