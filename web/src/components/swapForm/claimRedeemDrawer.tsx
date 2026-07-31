import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { type ComponentProps, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

import { type ClaimRedeemFlowStatus } from "./types";

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
  onClose: VoidFunction;
} & Omit<ComponentProps<typeof ClaimRedeemProgressDrawer>, "onRetry" | "steps">;

export function ClaimRedeemDrawer({ onClose, ...props }: Props) {
  const { flowStatus, onSubmit } = props;
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
          {...props}
          onRetry={isError ? onSubmit : undefined}
          steps={steps}
        />
      </Suspense>
    </Drawer>
  );
}
