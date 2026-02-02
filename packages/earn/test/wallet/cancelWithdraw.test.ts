import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { hemiSepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { cancelWithdraw } from "../../src/actions/wallet/cancelWithdraw";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: hemiSepolia,
} as unknown as WalletClient;

const validParameters = {
  requestId: BigInt(1),
};

describe("cancelWithdraw", function () {
  it("should emit 'cancel-withdraw-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = cancelWithdraw(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-withdraw-failed-validation", onFailedValidation);
    emitter.on("cancel-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-withdraw-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: hemiSepolia,
    } as unknown as WalletClient;

    const { emitter, promise } = cancelWithdraw(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-withdraw-failed-validation", onFailedValidation);
    emitter.on("cancel-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-withdraw-failed-validation' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = cancelWithdraw(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-withdraw-failed-validation", onFailedValidation);
    emitter.on("cancel-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-withdraw-failed-validation' if requestId is not a bigint", async function () {
    const parameters = { requestId: 1 };

    const { emitter, promise } = cancelWithdraw(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-withdraw-failed-validation", onFailedValidation);
    emitter.on("cancel-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Request ID must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit success events when cancel withdraw succeeds", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = cancelWithdraw(
      mockWalletClient,
      validParameters,
    );

    const onPreCancelWithdraw = vi.fn();
    const onUserSignedCancelWithdraw = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-withdraw", onPreCancelWithdraw);
    emitter.on("user-signed-cancel-withdraw", onUserSignedCancelWithdraw);
    emitter.on("cancel-withdraw-transaction-succeeded", onTransactionSucceeded);
    emitter.on("cancel-withdraw-settled", onSettled);

    await promise;

    expect(onPreCancelWithdraw).toHaveBeenCalledOnce();
    expect(onUserSignedCancelWithdraw).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-cancel-withdraw-error' when signing fails", async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = cancelWithdraw(
      mockWalletClient,
      validParameters,
    );

    const onPreCancelWithdraw = vi.fn();
    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-withdraw", onPreCancelWithdraw);
    emitter.on("user-signing-cancel-withdraw-error", onSigningError);
    emitter.on("cancel-withdraw-settled", onSettled);

    await promise;

    expect(onPreCancelWithdraw).toHaveBeenCalledOnce();
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-withdraw-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = cancelWithdraw(
      mockWalletClient,
      validParameters,
    );

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-withdraw-transaction-reverted", onTransactionReverted);
    emitter.on("cancel-withdraw-transaction-succeeded", onTransactionSucceeded);
    emitter.on("cancel-withdraw-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
