import { type Step, stepStatus } from "components/base/verticalStepper";
import { getDepositSteps } from "pages/earn/components/earnForm/getDepositSteps";
import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";

type StepText = Pick<Step, "description" | "title">;

export const getStakeSteps = ({
  approvalCompleted,
  approveText,
  confirmText,
  failedDescription,
  isMinted,
  needsApproval,
  step,
}: {
  approvalCompleted: boolean;
  approveText: StepText;
  confirmText: StepText;
  failedDescription: string;
  isMinted: boolean;
  needsApproval: boolean;
  step: DepositStep;
}) =>
  getDepositSteps({
    approvalCompleted,
    approveText,
    confirmText,
    depositStep: step,
    needsApproval,
  }).map(function (depositStep) {
    if (!isMinted) {
      return { ...depositStep, status: stepStatus.notReady };
    }
    if (depositStep.status === stepStatus.failed) {
      return { ...depositStep, description: failedDescription };
    }
    return depositStep;
  });
