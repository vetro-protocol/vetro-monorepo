import { EventEmitter } from "events";
import type { RequestDepositEmitter } from "pages/earn/hooks/targetYieldPool/useRequestDeposit";
import type { TransactionReceipt } from "viem";
import { describe, expect, it, vi } from "vitest";

import { handleRequestDepositFailures } from "../../../../../src/pages/earn/components/targetYieldForm/handleRequestDepositFailures";

const error = new Error("RPC error");
const receipt = { status: "success" } as TransactionReceipt;
const revertedReceipt = { status: "reverted" } as TransactionReceipt;

describe("handleRequestDepositFailures", function () {
  it("reports a validation failure as a deposit failure", function () {
    const emitter: RequestDepositEmitter = new EventEmitter();
    const onDepositStepChange = vi.fn();
    handleRequestDepositFailures({ emitter, onDepositStepChange });

    emitter.emit("request-deposit-failed-validation", "Vault is paused");

    expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(
      "deposit-failed",
    );
  });

  it("reports an unexpected preflight error as a deposit failure", function () {
    const emitter: RequestDepositEmitter = new EventEmitter();
    const onDepositStepChange = vi.fn();
    handleRequestDepositFailures({ emitter, onDepositStepChange });

    emitter.emit("unexpected-error", error);

    expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(
      "deposit-failed",
    );
  });

  it("reports validation as a deposit failure even during approval", function () {
    const emitter: RequestDepositEmitter = new EventEmitter();
    const onDepositStepChange = vi.fn();
    handleRequestDepositFailures({ emitter, onDepositStepChange });

    emitter.emit("pre-approve");
    emitter.emit("request-deposit-failed-validation", "Vault is paused");

    expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(
      "deposit-failed",
    );
  });

  it("reports an error during approval as an approval failure", function () {
    const emitter: RequestDepositEmitter = new EventEmitter();
    const onDepositStepChange = vi.fn();
    handleRequestDepositFailures({ emitter, onDepositStepChange });

    emitter.emit("pre-approve");
    emitter.emit("unexpected-error", error);

    expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(
      "approve-failed",
    );
  });

  it("reports an error after a successful approval as a deposit failure", function () {
    const emitter: RequestDepositEmitter = new EventEmitter();
    const onDepositStepChange = vi.fn();
    handleRequestDepositFailures({ emitter, onDepositStepChange });

    emitter.emit("pre-approve");
    emitter.emit("approve-transaction-succeeded", receipt);
    emitter.emit("unexpected-error", error);

    expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(
      "deposit-failed",
    );
  });

  it("reports a receipt failure during approval as an approval failure", function () {
    const emitter: RequestDepositEmitter = new EventEmitter();
    const onDepositStepChange = vi.fn();
    handleRequestDepositFailures({ emitter, onDepositStepChange });

    emitter.emit("pre-approve");
    emitter.emit("request-deposit-failed", error);

    expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(
      "approve-failed",
    );
  });

  it.each([
    {
      emitFailure(emitter: RequestDepositEmitter) {
        emitter.emit("user-signing-approval-error", error);
      },
      expected: "approve-failed",
      name: "approval signature rejection",
      phase: "pre-approve",
    },
    {
      emitFailure(emitter: RequestDepositEmitter) {
        emitter.emit("approve-transaction-reverted", revertedReceipt);
      },
      expected: "approve-failed",
      name: "approval transaction revert",
      phase: "pre-approve",
    },
    {
      emitFailure(emitter: RequestDepositEmitter) {
        emitter.emit("user-signing-request-deposit-error", error);
      },
      expected: "deposit-failed",
      name: "deposit signature rejection",
      phase: "pre-request-deposit",
    },
    {
      emitFailure(emitter: RequestDepositEmitter) {
        emitter.emit("request-deposit-transaction-reverted", revertedReceipt);
      },
      expected: "deposit-failed",
      name: "deposit transaction revert",
      phase: "pre-request-deposit",
    },
  ] as const)(
    "reports $name at the correct step",
    function ({ emitFailure, expected, phase }) {
      const emitter: RequestDepositEmitter = new EventEmitter();
      const onDepositStepChange = vi.fn();
      handleRequestDepositFailures({ emitter, onDepositStepChange });

      emitter.emit("pre-approve");
      emitter.emit(phase);
      emitFailure(emitter);

      expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(expected);
    },
  );

  it("reports a request receipt failure after approval as a deposit failure", function () {
    const emitter: RequestDepositEmitter = new EventEmitter();
    const onDepositStepChange = vi.fn();
    handleRequestDepositFailures({ emitter, onDepositStepChange });

    emitter.emit("pre-approve");
    emitter.emit("approve-transaction-succeeded", receipt);
    emitter.emit("pre-request-deposit");
    emitter.emit("request-deposit-failed", error);

    expect(onDepositStepChange).toHaveBeenCalledExactlyOnceWith(
      "deposit-failed",
    );
  });
});
