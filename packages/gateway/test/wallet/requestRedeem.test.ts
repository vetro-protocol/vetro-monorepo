import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { sepolia } from "viem/chains";
import { allowance, approve } from "viem-erc20/actions";
import { describe, expect, it, vi } from "vitest";

import { getPeggedToken } from "../../src/actions/public/getPeggedToken";
import { requestRedeem } from "../../src/actions/wallet/requestRedeem";

vi.mock("../../src/actions/public/getPeggedToken", () => ({
  getPeggedToken: vi.fn(),
}));

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
}));

const mockPeggedTokenAddress =
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as Address;

// @ts-expect-error - mock client
const mockWalletClient = {
  account: {
    address: zeroAddress,
  },
  chain: sepolia,
} as WalletClient;

const mockGatewayAddress =
  "0x3333333333333333333333333333333333333333" as Address;

const validParameters = {
  gatewayAddress: mockGatewayAddress,
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

  it("should emit 'request-redeem-failed-validation' if gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      gatewayAddress: "invalid_gateway",
    };

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
      "Invalid gateway address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      gatewayAddress: zeroAddress,
    };

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Gateway address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if peggedTokenAmount is not a bigint", async function () {
    const parameters = {
      gatewayAddress: mockGatewayAddress,
      peggedTokenAmount: 1000,
    };

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
    const parameters = {
      gatewayAddress: mockGatewayAddress,
      peggedTokenAmount: BigInt(0),
    };

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
    const parameters = {
      gatewayAddress: mockGatewayAddress,
      peggedTokenAmount: BigInt(-1),
    };

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

  it("should emit 'request-redeem-failed-validation' if approveAmount is less than peggedTokenAmount", async function () {
    const parameters = {
      approveAmount: BigInt(999),
      gatewayAddress: mockGatewayAddress,
      peggedTokenAmount: BigInt(1000),
    };

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Approve amount must be greater than or equal to amount",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve with approveAmount when provided and allowance is insufficient", async function () {
    const successReceipt = {
      status: "success",
    } as TransactionReceipt;

    const parameters = {
      approveAmount: BigInt(10000),
      gatewayAddress: mockGatewayAddress,
      peggedTokenAmount: BigInt(1000),
    };

    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(successReceipt)
      .mockResolvedValueOnce(successReceipt);

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-transaction-succeeded", onSucceeded);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(approve).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        amount: BigInt(10000),
      }),
    );
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(successReceipt);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should skip approval if allowance is sufficient and proceed to request redeem", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(validParameters.peggedTokenAmount);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onPreRequestRedeem = vi.fn();
    const onUserSigned = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("user-signed-request-redeem", onUserSigned);
    emitter.on("request-redeem-transaction-succeeded", onSucceeded);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).not.toHaveBeenCalled();
    expect(approve).not.toHaveBeenCalled();
    expect(onPreRequestRedeem).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve first if allowance is insufficient, then request redeem", async function () {
    const successReceipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenAmount - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(successReceipt)
      .mockResolvedValueOnce(successReceipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionSucceeded = vi.fn();
    const onPreRequestRedeem = vi.fn();
    const onUserSigned = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-succeeded", onApproveTransactionSucceeded);
    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("user-signed-request-redeem", onUserSigned);
    emitter.on("request-redeem-transaction-succeeded", onSucceeded);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(onPreRequestRedeem).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(successReceipt);
    expect(approve).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        amount: validParameters.peggedTokenAmount,
      }),
    );
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-approval-error' when approval signing fails", async function () {
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenAmount - BigInt(1),
    );
    vi.mocked(approve).mockRejectedValue(new Error("Approval signing error"));

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSigningApprovalError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signing-approval-error", onUserSigningApprovalError);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSigningApprovalError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'approve-transaction-reverted' when approval transaction reverts", async function () {
    const approvalReceipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenAmount - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(approvalReceipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionReverted = vi.fn();
    const onPreRequestRedeem = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-reverted", onApproveTransactionReverted);
    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      approvalReceipt,
    );
    expect(onPreRequestRedeem).not.toHaveBeenCalled();
    expect(approve).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed' when approval receipt fails", async function () {
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenAmount - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onRequestRedeemFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("request-redeem-failed", onRequestRedeemFailed);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRequestRedeemFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-request-redeem-error' when signing fails", async function () {
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(validParameters.peggedTokenAmount);
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
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(validParameters.peggedTokenAmount);
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

    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(validParameters.peggedTokenAmount);
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

    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(validParameters.peggedTokenAmount);
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
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(validParameters.peggedTokenAmount);
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
