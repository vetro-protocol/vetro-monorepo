import {
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { requestRedeem } from "../../src/actions/wallet/requestRedeem";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

// @ts-expect-error - mock client
const mockWalletClient = {
  account: {
    address: zeroAddress,
  },
  chain: sepolia,
} as WalletClient;

const validParameters = {
  peggedTokenAmount: BigInt(1000),
};

describe("requestRedeem", function () {
  it("should emit 'request-redeem-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = requestRedeem(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if client.chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = requestRedeem(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if client.account is not defined", async function () {
    // @ts-expect-error - Testing invalid input
    const clientWithoutAccount = {
      chain: sepolia,
    } as WalletClient;

    const { emitter, promise } = requestRedeem(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if peggedTokenAmount is not a bigint", async function () {
    const parameters = { peggedTokenAmount: 1000 };

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if peggedTokenAmount is zero", async function () {
    const parameters = { peggedTokenAmount: BigInt(0) };

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if peggedTokenAmount is negative", async function () {
    const parameters = { peggedTokenAmount: BigInt(-1) };

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-request-redeem-error' when signing fails", async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreRequestRedeem = vi.fn();
    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("user-signing-request-redeem-error", onSigningError);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreRequestRedeem).toHaveBeenCalledOnce();
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed' when receipt fails", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreRequestRedeem = vi.fn();
    const onUserSigned = vi.fn();
    const onFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("user-signed-request-redeem", onUserSigned);
    emitter.on("request-redeem-failed", onFailed);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreRequestRedeem).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreRequestRedeem = vi.fn();
    const onUserSigned = vi.fn();
    const onReverted = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("user-signed-request-redeem", onUserSigned);
    emitter.on("request-redeem-transaction-reverted", onReverted);
    emitter.on("request-redeem-transaction-succeeded", onSucceeded);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreRequestRedeem).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-transaction-succeeded' on success", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreRequestRedeem = vi.fn();
    const onUserSigned = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("user-signed-request-redeem", onUserSigned);
    emitter.on("request-redeem-transaction-succeeded", onSucceeded);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreRequestRedeem).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when an unexpected error occurs", async function () {
    vi.mocked(writeContract).mockImplementation(function () {
      throw new Error("Unexpected");
    });

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
