import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { type Step, stepStatus } from "components/base/verticalStepper";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";
import { type ComponentProps, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { lazyWithReload } from "utils/lazyWithReload";
import type { Address } from "viem";

import { getStakeSteps } from "./getStakeSteps";
import type { UnitPreview } from "./outputLabel";
import type { SwapFees } from "./swapFees";
import type { StakeOutput } from "./swapProgressDrawer";

const SwapProgressDrawer = lazyWithReload(() =>
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
  fromToken: TokenWithGateway;
  isOutputError: boolean;
  onClose: VoidFunction;
  onRetry: VoidFunction;
  oracleToken: Address;
  outputAmount: bigint | undefined;
  outputValue: string;
  showApproveStep: boolean;
  stake?: {
    approvalCompleted: boolean;
    canRetry: boolean;
    needsApproval: boolean;
    output: StakeOutput | undefined;
    step: DepositStep;
  };
  toToken: TokenWithGateway;
  unitPreview: UnitPreview;
} & Pick<
  ComponentProps<typeof SwapFees>,
  "networkFee" | "protocolFee" | "totalFees"
>;

// After the mint, the fee queries refetch with a changed balance and can fail,
// so the drawer keeps the first estimate it got for the whole flow.
function useFirstLoaded<T extends { data?: unknown } | undefined>(value: T) {
  const [loaded, setLoaded] = useState<T>();
  if (loaded === undefined && value?.data !== undefined) {
    setLoaded(value);
  }
  return loaded ?? value;
}

export function SwapDepositDrawer({
  flowStatus,
  networkFee,
  onClose,
  onRetry,
  showApproveStep,
  stake,
  totalFees,
  ...props
}: Props) {
  const { t } = useTranslation();
  const drawerNetworkFee = useFirstLoaded(networkFee);
  const drawerTotalFees = useFirstLoaded(totalFees);
  useCloseOnSuccess({
    onClose,
    success:
      flowStatus === "deposited" && (!stake || stake.step === "completed"),
  });

  const isMintError =
    flowStatus === "approve-error" || flowStatus === "deposit-error";
  const isStakeError =
    stake?.step === "approve-failed" || stake?.step === "deposit-failed";
  const canRetry = isMintError || (isStakeError && stake?.canRetry);

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

  if (stake) {
    const symbol = props.toToken.symbol;
    steps.push(
      ...getStakeSteps({
        approvalCompleted: stake.approvalCompleted,
        approveText: {
          description: t("pages.swap.progress.stake-approve-description", {
            symbol,
          }),
          title: t("pages.swap.progress.stake-approve-title", { symbol }),
        },
        confirmText: {
          description: t("pages.swap.progress.stake-confirm-description", {
            symbol,
          }),
          title: t("pages.swap.progress.stake-confirm-title", { symbol }),
        },
        failedDescription: t("pages.swap.progress.stake-failed-description", {
          symbol,
        }),
        isMinted: flowStatus === "deposited",
        needsApproval: stake.needsApproval,
        step: stake.step,
      }),
    );
  }

  return (
    <Drawer onClose={onClose} title={t("pages.swap.progress.title")}>
      <Suspense fallback={<DrawerLoader />}>
        <SwapProgressDrawer
          {...props}
          networkFee={drawerNetworkFee}
          onRetry={canRetry ? onRetry : undefined}
          stakeOutput={stake?.output}
          steps={steps}
          totalFees={drawerTotalFees}
        />
      </Suspense>
    </Drawer>
  );
}
