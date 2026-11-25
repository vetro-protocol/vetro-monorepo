import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";
import type { RequestDepositEmitter } from "pages/earn/hooks/targetYieldPool/useRequestDeposit";

export function handleRequestDepositFailures({
  emitter,
  onDepositStepChange,
}: {
  emitter: RequestDepositEmitter;
  onDepositStepChange: (step: DepositStep) => void;
}) {
  let failedStep: DepositStep = "deposit-failed";

  function handleFailed() {
    onDepositStepChange(failedStep);
  }

  emitter.on("pre-approve", function () {
    failedStep = "approve-failed";
  });
  emitter.on("approve-transaction-succeeded", function () {
    failedStep = "deposit-failed";
  });
  emitter.on("pre-request-deposit", function () {
    failedStep = "deposit-failed";
  });
  emitter.on("user-signing-approval-error", handleFailed);
  emitter.on("approve-transaction-reverted", handleFailed);
  emitter.on("user-signing-request-deposit-error", handleFailed);
  emitter.on("request-deposit-failed", handleFailed);
  emitter.on("request-deposit-failed-validation", function () {
    onDepositStepChange("deposit-failed");
  });
  emitter.on("unexpected-error", handleFailed);
  emitter.on("request-deposit-transaction-reverted", handleFailed);
}
