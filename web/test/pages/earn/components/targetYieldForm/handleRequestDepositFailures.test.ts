import { EventEmitter } from "events";
import type { RequestDepositEmitter } from "pages/earn/hooks/targetYieldPool/useRequestDeposit";
import type { TransactionReceipt } from "viem";
import { describe, expect, it, vi } from "vitest";

import { handleRequestDepositFailures } from "../../../../../src/pages/earn/components/targetYieldForm/handleRequestDepositFailures";

const error = new Error("RPC error");
const receipt = { status: "success" } as TransactionReceipt;

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
