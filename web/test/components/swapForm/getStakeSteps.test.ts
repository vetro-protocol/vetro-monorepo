import { stepStatus } from "components/base/verticalStepper";
import { describe, expect, it } from "vitest";

import { getStakeSteps } from "../../../src/components/swapForm/getStakeSteps";

const approveText = { description: "approve-description", title: "approve" };
const confirmText = { description: "confirm-description", title: "confirm" };

const base = {
  approvalCompleted: false,
  approveText,
  confirmText,
  failedDescription: "failed-description",
  isMinted: true,
  needsApproval: true,
};

describe("getStakeSteps", function () {
  it("shows every step as not ready before the mint completes", function () {
    expect(getStakeSteps({ ...base, isMinted: false, step: "idle" })).toEqual([
      { ...approveText, status: stepStatus.notReady },
      { ...confirmText, status: stepStatus.notReady },
    ]);
  });

  it("shows the approve step as ready after the mint completes", function () {
    expect(getStakeSteps({ ...base, step: "idle" })).toEqual([
      { ...approveText, status: stepStatus.ready },
      { ...confirmText, status: stepStatus.notReady },
    ]);
  });

  it("shows only the stake step when no approval is needed", function () {
    expect(
      getStakeSteps({ ...base, needsApproval: false, step: "idle" }),
    ).toEqual([{ ...confirmText, status: stepStatus.ready }]);
  });

  it("replaces the description of a failed approval", function () {
    expect(getStakeSteps({ ...base, step: "approve-failed" })).toEqual([
      {
        ...approveText,
        description: "failed-description",
        status: stepStatus.failed,
      },
      { ...confirmText, status: stepStatus.notReady },
    ]);
  });

  it("replaces the description of a failed stake", function () {
    expect(
      getStakeSteps({
        ...base,
        approvalCompleted: true,
        step: "deposit-failed",
      }),
    ).toEqual([
      { ...approveText, status: stepStatus.completed },
      {
        ...confirmText,
        description: "failed-description",
        status: stepStatus.failed,
      },
    ]);
  });
});
