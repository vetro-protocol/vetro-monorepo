import { type Step, stepStatus } from "components/base/verticalStepper";

import type { DepositStep } from "./stakeFormReducer";

type StepText = Pick<Step, "description" | "title">;

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

export function getDepositSteps({
  approvalCompleted,
  approveText,
  confirmText,
  depositStep,
  needsApproval,
}: {
  approvalCompleted: boolean;
  approveText: StepText;
  confirmText: StepText;
  depositStep: DepositStep;
  needsApproval: boolean | undefined;
}) {
  const confirmStatus = getConfirmStepStatus(depositStep);
  const approvalInProgress =
    depositStep === "approving" || depositStep === "approved";
  const showApproveStep =
    approvalCompleted ||
    (depositStep !== "completed" && (needsApproval || approvalInProgress));

  const confirmStep = {
    ...confirmText,
    status:
      !showApproveStep && confirmStatus === stepStatus.notReady
        ? stepStatus.ready
        : confirmStatus,
  };

  if (!showApproveStep) {
    return [confirmStep];
  }

  return [
    { ...approveText, status: getApproveStepStatus(depositStep) },
    confirmStep,
  ];
}
