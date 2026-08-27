import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { RenderFiatValue } from "components/base/fiatValue";
import { VerticalStepper, stepStatus } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import { useVaultPreviewDeposit } from "hooks/useVaultPreviewDeposit";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";

import type { DepositStep } from "../stakeDrawer/stakeDrawerReducer";

import { ProgressAmount } from "./progressAmount";

type Props = {
  amount: string;
  approvalCompleted: boolean;
  assets: bigint;
  depositStep: DepositStep;
  needsApproval: boolean;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  peggedToken: TokenWithGateway;
  shareToken: Token;
  stakingVaultAddress: Address;
};

function getApproveStepStatus(depositStep: DepositStep) {
  if (
    depositStep === "approved" ||
    depositStep === "completed" ||
    depositStep === "deposit-failed" ||
    depositStep === "depositing"
  ) {
    return stepStatus.completed;
  }
  if (depositStep === "approving") {
    return stepStatus.progress;
  }
  if (depositStep === "approve-failed") {
    return stepStatus.failed;
  }
  return stepStatus.ready;
}

function getConfirmStepStatus(depositStep: DepositStep) {
  if (depositStep === "completed") {
    return stepStatus.completed;
  }
  if (depositStep === "depositing") {
    return stepStatus.progress;
  }
  if (depositStep === "deposit-failed") {
    return stepStatus.failed;
  }
  if (depositStep === "approved") {
    return stepStatus.ready;
  }
  return stepStatus.notReady;
}

function useDepositSteps({
  approvalCompleted,
  depositStep,
  needsApproval,
}: Pick<Props, "approvalCompleted" | "depositStep" | "needsApproval">) {
  const { t } = useTranslation();

  const confirmStatus = getConfirmStepStatus(depositStep);
  const approvalInProgress =
    depositStep === "approving" || depositStep === "approved";
  const showApproveStep =
    (depositStep === "completed" && approvalCompleted) ||
    (depositStep !== "completed" &&
      (needsApproval || approvalInProgress || approvalCompleted));

  const confirmStep = {
    description: t("pages.earn.stake.deposit-step-confirm-description"),
    status:
      !showApproveStep && confirmStatus === stepStatus.notReady
        ? stepStatus.ready
        : confirmStatus,
    title: t("pages.earn.stake.deposit-step-confirm-title"),
  };

  if (!showApproveStep) {
    return [confirmStep];
  }

  return [
    {
      description: t("pages.earn.stake.deposit-step-approve-description"),
      status: getApproveStepStatus(depositStep),
      title: t("pages.earn.stake.deposit-step-approve-title"),
    },
    confirmStep,
  ];
}

export function StakeDepositProgressDrawer({
  amount,
  approvalCompleted,
  assets,
  depositStep,
  needsApproval,
  networkFee,
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const { data: sharesReceived, status: sharesReceivedStatus } =
    useVaultPreviewDeposit({ assets, stakingVaultAddress });

  const steps = useDepositSteps({
    approvalCompleted,
    depositStep,
    needsApproval,
  });

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>{t("pages.earn.stake.deposit-in-progress")}</DrawerTitle>

      <div className="flex flex-col gap-10 border-y border-gray-200 bg-gray-50 p-6">
        <ProgressAmount
          amount={amount}
          fiatValue={<RenderFiatValue token={peggedToken} value={assets} />}
          label={t("pages.earn.stake.you-will-stake")}
          token={peggedToken}
        />
        <ProgressAmount
          amount={
            <RenderCryptoValue
              status={sharesReceivedStatus}
              token={shareToken}
              value={sharesReceived}
            />
          }
          fiatValue={<RenderFiatValue token={peggedToken} value={assets} />}
          label={t("pages.earn.stake.you-will-receive-estimated")}
          token={shareToken}
        />
      </div>

      <DrawerFeesContainer>
        <NetworkFees networkFee={networkFee} />
      </DrawerFeesContainer>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 px-6 pb-6">
        <p className="text-caption text-gray-500">
          {t("pages.earn.stake.deposit-progress")}
        </p>
        <div className="border-t border-gray-200">
          <VerticalStepper steps={steps} />
        </div>
      </div>
    </div>
  );
}
