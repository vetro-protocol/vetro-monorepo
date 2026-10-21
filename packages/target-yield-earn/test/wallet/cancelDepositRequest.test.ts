import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import {
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { sepolia } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCancelableDepositRequest } from "../../src/actions/public/getCancelableDepositRequest.ts";
import { cancelDepositRequest } from "../../src/actions/wallet/cancelDepositRequest.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("../../src/actions/public/getCancelableDepositRequest.ts", () => ({
  getCancelableDepositRequest: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as unknown as WalletClient;

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  controller: "0x1111111111111111111111111111111111111111" as Address,
};

const otherController = "0x3333333333333333333333333333333333333333" as Address;

const rpcError = new Error("RPC error");

const successReceipt = { status: "success" } as TransactionReceipt;

describe("cancelDepositRequest", function () {
  beforeEach(function () {
    vi.mocked(getCancelableDepositRequest).mockResolvedValue(BigInt(1000));
  });

  it("should emit 'cancel-deposit-request-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = cancelDepositRequest(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed-validation", onFailedValidation);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: sepolia,
    } as unknown as WalletClient;

    const { emitter, promise } = cancelDepositRequest(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed-validation", onFailedValidation);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-failed-validation' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = cancelDepositRequest(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed-validation", onFailedValidation);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-failed-validation' if vault address is invalid", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed-validation", onFailedValidation);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid vault address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-failed-validation' if controller address is invalid", async function () {
    const parameters = {
      ...validParameters,
      controller: zeroAddress,
    };

    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed-validation", onFailedValidation);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid controller address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-failed-validation' if there is no cancelable deposit request", async function () {
    vi.mocked(getCancelableDepositRequest).mockResolvedValue(BigInt(0));

    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed-validation", onFailedValidation);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(getCancelableDepositRequest).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      {
        address: validParameters.address,
        controller: validParameters.controller,
      },
    );
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "No cancelable deposit request",
    );
    expect(writeContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-failed-validation' if the account is not the controller or its operator", async function () {
    vi.mocked(readContract).mockResolvedValue(false);

    const { emitter, promise } = cancelDepositRequest(mockWalletClient, {
      ...validParameters,
      controller: otherController,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed-validation", onFailedValidation);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(readContract).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [otherController, mockWalletClient.account!.address],
      functionName: "isOperator",
    });
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Account is not the controller or its operator",
    );
    expect(writeContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should cancel for a controller when the account is its operator", async function () {
    vi.mocked(readContract).mockResolvedValue(true);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = cancelDepositRequest(mockWalletClient, {
      ...validParameters,
      controller: otherController,
    });

    await promise;

    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({
        args: [otherController],
        functionName: "cancelDepositRequest",
      }),
    );
  });

  it("should not read the operator status when the account is the controller", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = cancelDepositRequest(mockWalletClient, validParameters);

    await promise;

    expect(readContract).not.toHaveBeenCalled();
  });

  it.each([
    {
      mockRead: () => vi.mocked(readContract).mockRejectedValueOnce(rpcError),
      name: "isOperator",
    },
    {
      mockRead: () =>
        vi.mocked(getCancelableDepositRequest).mockRejectedValueOnce(rpcError),
      name: "cancelableDepositRequest",
    },
  ])(
    "should emit 'unexpected-error' when the $name read fails",
    async function ({ mockRead }) {
      mockRead();

      const { emitter, promise } = cancelDepositRequest(mockWalletClient, {
        ...validParameters,
        controller: otherController,
      });

      const onUnexpectedError = vi.fn();
      const onSettled = vi.fn();

      emitter.on("unexpected-error", onUnexpectedError);
      emitter.on("cancel-deposit-request-settled", onSettled);

      await promise;

      expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(rpcError);
      expect(writeContract).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should emit success events when cancel deposit request succeeds", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      validParameters,
    );

    const onPreCancelDepositRequest = vi.fn();
    const onUserSignedCancelDepositRequest = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-deposit-request", onPreCancelDepositRequest);
    emitter.on(
      "user-signed-cancel-deposit-request",
      onUserSignedCancelDepositRequest,
    );
    emitter.on(
      "cancel-deposit-request-transaction-succeeded",
      onTransactionSucceeded,
    );
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onPreCancelDepositRequest).toHaveBeenCalledOnce();
    expect(onUserSignedCancelDepositRequest).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      abi: expect.anything(),
      account: mockWalletClient.account,
      address: validParameters.address,
      args: [validParameters.controller],
      chain: mockWalletClient.chain,
      functionName: "cancelDepositRequest",
    });
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-cancel-deposit-request-error' when signing fails", async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      validParameters,
    );

    const onPreCancelDepositRequest = vi.fn();
    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-cancel-deposit-request", onPreCancelDepositRequest);
    emitter.on("user-signing-cancel-deposit-request-error", onSigningError);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onPreCancelDepositRequest).toHaveBeenCalledOnce();
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-failed' when waiting for the receipt fails", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      validParameters,
    );

    const onFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("cancel-deposit-request-failed", onFailed);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'cancel-deposit-request-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      validParameters,
    );

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on(
      "cancel-deposit-request-transaction-reverted",
      onTransactionReverted,
    );
    emitter.on(
      "cancel-deposit-request-transaction-succeeded",
      onTransactionSucceeded,
    );
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' and settle when params is not defined", async function () {
    const { emitter, promise } = cancelDepositRequest(
      mockWalletClient,
      // @ts-expect-error testing a missing params object
      undefined,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("cancel-deposit-request-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(TypeError),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
