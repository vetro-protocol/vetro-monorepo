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
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMaxWithdraw } from "../../src/actions/public/getMaxWithdraw";
import { getPeggedToken } from "../../src/actions/public/getPeggedToken";
import { getWithdrawalDelayEnabled } from "../../src/actions/public/getWithdrawalDelayEnabled";
import { isInstantRedeemWhitelisted } from "../../src/actions/public/isInstantRedeemWhitelisted";
import { redeem } from "../../src/actions/wallet/redeem";

vi.mock("../../src/actions/public/getMaxWithdraw", () => ({
  getMaxWithdraw: vi.fn(),
}));

vi.mock("../../src/actions/public/getPeggedToken", () => ({
  getPeggedToken: vi.fn(),
}));

vi.mock("../../src/actions/public/getWithdrawalDelayEnabled", () => ({
  getWithdrawalDelayEnabled: vi.fn(),
}));

vi.mock("../../src/actions/public/isInstantRedeemWhitelisted", () => ({
  isInstantRedeemWhitelisted: vi.fn(),
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
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as WalletClient;

const mockGatewayAddress =
  "0x3333333333333333333333333333333333333333" as Address;

const validParameters = {
  gatewayAddress: mockGatewayAddress,
  minAmountOut: BigInt(900),
  peggedTokenIn: BigInt(1000),
  receiver: "0x2222222222222222222222222222222222222222" as Address,
  tokenOut: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

describe("redeem", function () {
  beforeEach(function () {
    // Default: treasury has enough balance for all tests
    vi.mocked(getMaxWithdraw).mockResolvedValue(BigInt(1_000_000));
  });

  it("should emit 'redeem-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = redeem(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if client.account is not defined", async function () {
    // @ts-expect-error - Testing invalid input
    const clientWithoutAccount = {
      chain: sepolia,
    } as WalletClient;

    const { emitter, promise } = redeem(clientWithoutAccount, validParameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if client.chain is not defined", async function () {
    // @ts-expect-error - Testing invalid input
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = redeem(clientWithoutChain, validParameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      gatewayAddress: "invalid_gateway",
    };

    const { emitter, promise } = redeem(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid gateway address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      gatewayAddress: zeroAddress,
    };

    const { emitter, promise } = redeem(mockWalletClient, parameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Gateway address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if token address is not valid", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: "invalid_token",
    };

    const { emitter, promise } = redeem(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid token address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if tokenOut address is zero address", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: zeroAddress,
    };

    const { emitter, promise } = redeem(mockWalletClient, parameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Token address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if receiver is not a valid address", async function () {
    const parameters = {
      ...validParameters,
      receiver: "invalid_receiver",
    };

    const { emitter, promise } = redeem(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid receiver address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if receiver address is zero address", async function () {
    const parameters = {
      ...validParameters,
      receiver: zeroAddress,
    };

    const { emitter, promise } = redeem(mockWalletClient, parameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Receiver address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if peggedTokenIn is not a bigint", async function () {
    const parameters = { ...validParameters, peggedTokenIn: 1000 };

    const { emitter, promise } = redeem(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if peggedTokenIn is zero", async function () {
    const parameters = { ...validParameters, peggedTokenIn: BigInt(0) };

    const { emitter, promise } = redeem(mockWalletClient, parameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if peggedTokenIn is negative", async function () {
    const parameters = { ...validParameters, peggedTokenIn: BigInt(-1) };

    const { emitter, promise } = redeem(mockWalletClient, parameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if approveAmount is less than peggedTokenIn", async function () {
    const parameters = {
      ...validParameters,
      approveAmount: validParameters.peggedTokenIn - BigInt(1),
    };

    const { emitter, promise } = redeem(mockWalletClient, parameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Approve amount must be greater than or equal to amount",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if minAmountOut is not a bigint", async function () {
    const parameters = { ...validParameters, minAmountOut: 900 };

    const { emitter, promise } = redeem(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Minimum output must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if minAmountOut is negative", async function () {
    const parameters = { ...validParameters, minAmountOut: BigInt(-1) };

    const { emitter, promise } = redeem(mockWalletClient, parameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Minimum output cannot be negative",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed-validation' if treasury has insufficient balance", async function () {
    vi.mocked(getMaxWithdraw).mockResolvedValue(BigInt(100));

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Not enough balance in treasury",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should skip approval if user is not whitelisted and delay is enabled, and proceed to redeem", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onPreRedeem = vi.fn();
    const onUserSignedRedeem = vi.fn();
    const onRedeemTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("user-signed-redeem", onUserSignedRedeem);
    emitter.on("redeem-transaction-succeeded", onRedeemTransactionSucceeded);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).not.toHaveBeenCalled();
    expect(approve).not.toHaveBeenCalled();
    expect(allowance).not.toHaveBeenCalled();
    expect(getPeggedToken).not.toHaveBeenCalled();
    expect(onPreRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRedeemTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    );
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should require approval if not whitelisted but delay is disabled", async function () {
    const successReceipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(false);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenIn - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(successReceipt)
      .mockResolvedValueOnce(successReceipt);

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionSucceeded = vi.fn();
    const onPreRedeem = vi.fn();
    const onUserSignedRedeem = vi.fn();
    const onRedeemTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-succeeded", onApproveTransactionSucceeded);
    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("user-signed-redeem", onUserSignedRedeem);
    emitter.on("redeem-transaction-succeeded", onRedeemTransactionSucceeded);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(onPreRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRedeemTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(approve).toHaveBeenCalledOnce();
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should skip approval if whitelisted and allowance is sufficient", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(validParameters.peggedTokenIn);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionSucceeded = vi.fn();
    const onApproveTransactionReverted = vi.fn();
    const onPreRedeem = vi.fn();
    const onUserSignedRedeem = vi.fn();
    const onRedeemTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-succeeded", onApproveTransactionSucceeded);
    emitter.on("approve-transaction-reverted", onApproveTransactionReverted);
    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("user-signed-redeem", onUserSignedRedeem);
    emitter.on("redeem-transaction-succeeded", onRedeemTransactionSucceeded);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).not.toHaveBeenCalled();
    expect(onUserSignedApproval).not.toHaveBeenCalled();
    expect(onApproveTransactionSucceeded).not.toHaveBeenCalled();
    expect(onApproveTransactionReverted).not.toHaveBeenCalled();
    expect(onPreRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRedeemTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    );
    expect(approve).not.toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve first if whitelisted and allowance is insufficient, then redeem", async function () {
    const successReceipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenIn - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(successReceipt)
      .mockResolvedValueOnce(successReceipt);

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionSucceeded = vi.fn();
    const onPreRedeem = vi.fn();
    const onUserSignedRedeem = vi.fn();
    const onRedeemTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-succeeded", onApproveTransactionSucceeded);
    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("user-signed-redeem", onUserSignedRedeem);
    emitter.on("redeem-transaction-succeeded", onRedeemTransactionSucceeded);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(onPreRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRedeemTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(approve).toHaveBeenCalledOnce();
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve with approveAmount when provided and whitelisted with insufficient allowance", async function () {
    const successReceipt = {
      status: "success",
    } as TransactionReceipt;

    const approveAmount = validParameters.peggedTokenIn * BigInt(10);

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenIn - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(successReceipt)
      .mockResolvedValueOnce(successReceipt);

    const { emitter, promise } = redeem(mockWalletClient, {
      ...validParameters,
      approveAmount,
    });

    const onSettled = vi.fn();
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(approve).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        amount: approveAmount,
      }),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-approval-error' when approval signing fails", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenIn - BigInt(1),
    );
    vi.mocked(approve).mockRejectedValue(new Error("Approval signing error"));

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onUserSigningApprovalError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signing-approval-error", onUserSigningApprovalError);
    emitter.on("redeem-settled", onSettled);

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

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenIn - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(approvalReceipt);

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionReverted = vi.fn();
    const onApproveTransactionSucceeded = vi.fn();
    const onPreRedeem = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-reverted", onApproveTransactionReverted);
    emitter.on("approve-transaction-succeeded", onApproveTransactionSucceeded);
    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      approvalReceipt,
    );
    expect(onApproveTransactionSucceeded).not.toHaveBeenCalled();
    expect(onPreRedeem).not.toHaveBeenCalled();
    expect(approve).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed' when approval receipt fails", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);
    vi.mocked(getPeggedToken).mockResolvedValue(mockPeggedTokenAddress);
    vi.mocked(allowance).mockResolvedValue(
      validParameters.peggedTokenIn - BigInt(1),
    );
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onRedeemFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("redeem-failed", onRedeemFailed);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRedeemFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-redeem-error' when redeem signing fails", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);
    vi.mocked(writeContract).mockRejectedValue(
      new Error("Redeem signing error"),
    );

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreRedeem = vi.fn();
    const onUserSigningRedeemError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("user-signing-redeem-error", onUserSigningRedeemError);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreRedeem).toHaveBeenCalledOnce();
    expect(onUserSigningRedeemError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-failed' when redeem receipt fails", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreRedeem = vi.fn();
    const onUserSignedRedeem = vi.fn();
    const onRedeemFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("user-signed-redeem", onUserSignedRedeem);
    emitter.on("redeem-failed", onRedeemFailed);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRedeemFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'redeem-transaction-reverted' when redeem transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onPreRedeem = vi.fn();
    const onUserSignedRedeem = vi.fn();
    const onRedeemTransactionReverted = vi.fn();
    const onRedeemTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-redeem", onPreRedeem);
    emitter.on("user-signed-redeem", onUserSignedRedeem);
    emitter.on("redeem-transaction-reverted", onRedeemTransactionReverted);
    emitter.on("redeem-transaction-succeeded", onRedeemTransactionSucceeded);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onPreRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onRedeemTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      receipt,
    );
    expect(onRedeemTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as unknown as WalletClient;

    const { emitter, promise } = redeem(clientWithoutChain, validParameters);

    const onRedeemFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("redeem-failed-validation", onRedeemFailedValidation);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onRedeemFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when getPeggedToken fails", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);
    vi.mocked(getPeggedToken).mockRejectedValue(
      new Error("Failed to get pegged token"),
    );

    const { emitter, promise } = redeem(mockWalletClient, validParameters);

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("redeem-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
