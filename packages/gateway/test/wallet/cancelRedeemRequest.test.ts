import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { cancelRedeemRequest } from "../../src/actions/wallet/cancelRedeemRequest";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

const mockGatewayAddress =
  "0x3333333333333333333333333333333333333333" as Address;

// @ts-expect-error - mock client
const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as WalletClient;

const validParameters = {
  gatewayAddress: mockGatewayAddress,
};

describe("cancelRedeemRequest", function () {
  it("should emit 'cancel-redeem-request-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = cancelRedeemRequest(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-redeem-request-failed-validation", onFailedValidation);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-redeem-request-failed-validation' if client.chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = cancelRedeemRequest(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-redeem-request-failed-validation", onFailedValidation);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-redeem-request-failed-validation' if client.account is not defined", async function () {
    // @ts-expect-error - Testing invalid input
    const clientWithoutAccount = {
      chain: sepolia,
    } as WalletClient;

    const { emitter, promise } = cancelRedeemRequest(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-redeem-request-failed-validation", onFailedValidation);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-redeem-request-failed-validation' if gateway address is not valid", async function () {
    const { emitter, promise } = cancelRedeemRequest(mockWalletClient, {
      // @ts-expect-error - Testing invalid input
      gatewayAddress: "invalid_gateway",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-redeem-request-failed-validation", onFailedValidation);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid gateway address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-redeem-request-failed-validation' if gateway address is zero address", async function () {
    const { emitter, promise } = cancelRedeemRequest(mockWalletClient, {
      gatewayAddress: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-redeem-request-failed-validation", onFailedValidation);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Gateway address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-cancel-redeem-request-error' when signing fails", async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = cancelRedeemRequest(
      mockWalletClient,
      validParameters,
    );

    const onPreCancel = vi.fn();
    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-redeem-request", onPreCancel);
    emitter.on("user-signing-cancel-redeem-request-error", onSigningError);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onPreCancel).toHaveBeenCalledOnce();
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-redeem-request-failed' when receipt fails", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = cancelRedeemRequest(
      mockWalletClient,
      validParameters,
    );

    const onPreCancel = vi.fn();
    const onUserSigned = vi.fn();
    const onFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-redeem-request", onPreCancel);
    emitter.on("user-signed-cancel-redeem-request", onUserSigned);
    emitter.on("cancel-redeem-request-failed", onFailed);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onPreCancel).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-redeem-request-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = cancelRedeemRequest(
      mockWalletClient,
      validParameters,
    );

    const onPreCancel = vi.fn();
    const onUserSigned = vi.fn();
    const onReverted = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-redeem-request", onPreCancel);
    emitter.on("user-signed-cancel-redeem-request", onUserSigned);
    emitter.on("cancel-redeem-request-transaction-reverted", onReverted);
    emitter.on("cancel-redeem-request-transaction-succeeded", onSucceeded);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onPreCancel).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-redeem-request-transaction-succeeded' on success", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = cancelRedeemRequest(
      mockWalletClient,
      validParameters,
    );

    const onPreCancel = vi.fn();
    const onUserSigned = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-redeem-request", onPreCancel);
    emitter.on("user-signed-cancel-redeem-request", onUserSigned);
    emitter.on("cancel-redeem-request-transaction-succeeded", onSucceeded);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onPreCancel).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when an unexpected error occurs", async function () {
    vi.mocked(writeContract).mockImplementation(function () {
      throw new Error("Unexpected");
    });

    const { emitter, promise } = cancelRedeemRequest(
      mockWalletClient,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("cancel-redeem-request-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
