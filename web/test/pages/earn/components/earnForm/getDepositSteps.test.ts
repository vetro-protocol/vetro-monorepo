import { stepStatus } from "components/base/verticalStepper";
import { describe, expect, it } from "vitest";

import { getDepositSteps } from "../../../../../src/pages/earn/components/earnForm/getDepositSteps";

const approveText = { description: "approve-description", title: "approve" };
const confirmText = { description: "confirm-description", title: "confirm" };

const getStatuses = (params: Parameters<typeof getDepositSteps>[0]) =>
  getDepositSteps(params).map((step) => [step.title, step.status]);

const base = {
  approvalCompleted: false,
  approveText,
  confirmText,
  needsApproval: false,
};

describe("getDepositSteps", function () {
  it("shows only a ready confirm step when no approval is needed", function () {
    expect(getStatuses({ ...base, depositStep: "idle" })).toEqual([
      ["confirm", stepStatus.ready],
    ]);
  });

  it("keeps the step texts", function () {
    expect(getDepositSteps({ ...base, depositStep: "idle" })).toEqual([
      { ...confirmText, status: stepStatus.ready },
    ]);
  });

  it("shows a ready approve step and a not ready confirm step when approval is needed", function () {
    expect(
      getStatuses({ ...base, depositStep: "idle", needsApproval: true }),
    ).toEqual([
      ["approve", stepStatus.ready],
      ["confirm", stepStatus.notReady],
    ]);
  });

  it("shows the approve step in progress while approving", function () {
    expect(getStatuses({ ...base, depositStep: "approving" })).toEqual([
      ["approve", stepStatus.progress],
      ["confirm", stepStatus.notReady],
    ]);
  });

  it("shows a failed approve step when the approval fails", function () {
    expect(
      getStatuses({
        ...base,
        depositStep: "approve-failed",
        needsApproval: true,
      }),
    ).toEqual([
      ["approve", stepStatus.failed],
      ["confirm", stepStatus.notReady],
    ]);
  });

  it("keeps the approve step after the allowance refetch removes the need for approval", function () {
    expect(
      getStatuses({
        ...base,
        approvalCompleted: true,
        depositStep: "depositing",
      }),
    ).toEqual([
      ["approve", stepStatus.completed],
      ["confirm", stepStatus.progress],
    ]);
  });

  it("shows a failed confirm step when the deposit fails", function () {
    expect(getStatuses({ ...base, depositStep: "deposit-failed" })).toEqual([
      ["confirm", stepStatus.failed],
    ]);
  });

  it("shows both steps completed when the approval was done in this flow", function () {
    expect(
      getStatuses({
        ...base,
        approvalCompleted: true,
        depositStep: "completed",
        needsApproval: true,
      }),
    ).toEqual([
      ["approve", stepStatus.completed],
      ["confirm", stepStatus.completed],
    ]);
  });

  it("hides the approve step on completion when no approval was done in this flow", function () {
    expect(
      getStatuses({ ...base, depositStep: "completed", needsApproval: true }),
    ).toEqual([["confirm", stepStatus.completed]]);
  });
});
