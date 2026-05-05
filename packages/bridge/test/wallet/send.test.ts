import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { bsc, hemi } from "viem/chains";
import { allowance, approve } from "viem-erc20/actions";
import { describe, expect, it, vi } from "vitest";

import { send } from "../../src/actions/wallet/send";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
  simulateContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
}));

const account = "0x1111111111111111111111111111111111111111" as Address;
const tokenAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address;

const mockWalletClient = {
  account: { address: account },
  chain: bsc,
} as unknown as WalletClient;

const validParameters = {
  amount: BigInt(1000),
  destinationChainId: hemi.id,
  oftAddress: "0x1234567890123456789012345678901234567890" as Address,
  recipient: "0x2222222222222222222222222222222222222222" as Address,
};

const fee = { lzTokenFee: 0n, nativeFee: 1_000_000_000n };

const mockReadContractFor = function ({
  approvalRequired = false,
}: { approvalRequired?: boolean } = {}) {
  vi.mocked(readContract).mockImplementation(async function (
    _client: unknown,
    params: { functionName: string },
  ): Promise<unknown> {
    switch (params.functionName) {
      case "approvalRequired":
        return approvalRequired;
      case "token":
        return tokenAddress;
      case "quoteSend":
        return fee;
      default:
        throw new Error(`unexpected functionName: ${params.functionName}`);
    }
  });
};

describe("send", function () {
  it("should emit 'send-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = send(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onSendFailedValidation = vi.fn();
    const onSettled = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'send-failed-validation' if client.chain is not defined", async function () {
    const clientWithoutChain = {
      account: { address: account },
    } as WalletClient;
    const { emitter, promise } = send(clientWithoutChain, validParameters);

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
  });

  it("should emit 'send-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = { chain: bsc } as unknown as WalletClient;
    const { emitter, promise } = send(clientWithoutAccount, validParameters);

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
  });

  it("should emit 'send-failed-validation' if oftAddress is invalid", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      oftAddress: zeroAddress,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "OFT address is invalid",
    );
  });

  it("should emit 'send-failed-validation' if recipient is invalid", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      recipient: zeroAddress,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Recipient address is invalid",
    );
  });

  it("should emit 'send-failed-validation' if amount is not a bigint", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      amount: 1000,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be a bigint",
    );
  });

  it("should emit 'send-failed-validation' if amount is zero", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      amount: 0n,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
  });

  it("should emit 'send-failed-validation' if minAmount is greater than amount", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      minAmount: validParameters.amount + 1n,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Min amount must be less than or equal to amount",
    );
  });

  it("should emit 'send-failed-validation' if minAmount is zero", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      minAmount: 0n,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Min amount must be greater than 0",
    );
  });

  it("should emit 'send-failed-validation' if approveAmount is less than amount", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      approveAmount: validParameters.amount - 1n,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Approve amount must be greater than or equal to amount",
    );
  });

  it("should emit 'send-failed-validation' when source and destination chains match", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      destinationChainId: bsc.id,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Destination chain must be different from source chain",
    );
  });

  it("should emit 'send-failed-validation' when destinationChainId has no EID", async function () {
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      destinationChainId: 999_999,
    });

    const onSendFailedValidation = vi.fn();
    emitter.on("send-failed-validation", onSendFailedValidation);

    await promise;

    expect(onSendFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Unsupported destination chain",
    );
  });

  it("should skip approval entirely when approvalRequired is false", async function () {
    mockReadContractFor({ approvalRequired: false });
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: "success",
    } as TransactionReceipt);

    const { emitter, promise } = send(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onPreSend = vi.fn();
    const onUserSignedSend = vi.fn();
    const onSendTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-approve", onPreApprove);
    emitter.on("pre-send", onPreSend);
    emitter.on("user-signed-send", onUserSignedSend);
    emitter.on("send-transaction-succeeded", onSendTransactionSucceeded);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onPreApprove).not.toHaveBeenCalled();
    expect(allowance).not.toHaveBeenCalled();
    expect(approve).not.toHaveBeenCalled();
    expect(onPreSend).toHaveBeenCalledOnce();
    expect(onUserSignedSend).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSendTransactionSucceeded).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should read token() and allowance but skip approve when allowance is sufficient", async function () {
    mockReadContractFor({ approvalRequired: true });
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: "success",
    } as TransactionReceipt);

    const { emitter, promise } = send(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onPreSend = vi.fn();
    const onSendTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-approve", onPreApprove);
    emitter.on("pre-send", onPreSend);
    emitter.on("send-transaction-succeeded", onSendTransactionSucceeded);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(allowance).toHaveBeenCalledOnce();
    expect(approve).not.toHaveBeenCalled();
    expect(onPreApprove).not.toHaveBeenCalled();
    expect(onPreSend).toHaveBeenCalledOnce();
    expect(onSendTransactionSucceeded).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should run full approval lifecycle when approvalRequired and allowance is insufficient", async function () {
    mockReadContractFor({ approvalRequired: true });
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - 1n);
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce({ status: "success" } as TransactionReceipt)
      .mockResolvedValueOnce({ status: "success" } as TransactionReceipt);

    const { emitter, promise } = send(mockWalletClient, validParameters);

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionSucceeded = vi.fn();
    const onPreSend = vi.fn();
    const onUserSignedSend = vi.fn();
    const onSendTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-succeeded", onApproveTransactionSucceeded);
    emitter.on("pre-send", onPreSend);
    emitter.on("user-signed-send", onUserSignedSend);
    emitter.on("send-transaction-succeeded", onSendTransactionSucceeded);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(approve).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionSucceeded).toHaveBeenCalledOnce();
    expect(onPreSend).toHaveBeenCalledOnce();
    expect(onUserSignedSend).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSendTransactionSucceeded).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve with explicit approveAmount when allowance is insufficient", async function () {
    mockReadContractFor({ approvalRequired: true });
    const approveAmount = validParameters.amount * 10n;
    vi.mocked(allowance).mockResolvedValue(0n);
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: "success",
    } as TransactionReceipt);

    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      approveAmount,
    });

    const onSettled = vi.fn();
    emitter.on("send-settled", onSettled);

    await promise;

    expect(approve).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({ amount: approveAmount }),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should pass minAmount through to simulateContract args", async function () {
    mockReadContractFor({ approvalRequired: false });
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: "success",
    } as TransactionReceipt);

    const minAmount = validParameters.amount - 10n;
    const { emitter, promise } = send(mockWalletClient, {
      ...validParameters,
      minAmount,
    });

    const onSettled = vi.fn();
    emitter.on("send-settled", onSettled);

    await promise;

    expect(simulateContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          expect.objectContaining({ minAmountLD: minAmount }),
          fee,
          account,
        ],
        value: fee.nativeFee,
      }),
    );
  });

  it("should use walletClient.account.address as refundAddress", async function () {
    mockReadContractFor({ approvalRequired: false });
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: "success",
    } as TransactionReceipt);

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onSettled = vi.fn();
    emitter.on("send-settled", onSettled);

    await promise;

    expect(simulateContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [expect.anything(), fee, account],
      }),
    );
  });

  it("should emit 'user-signing-approval-error' when approval signing fails", async function () {
    mockReadContractFor({ approvalRequired: true });
    vi.mocked(allowance).mockResolvedValue(0n);
    vi.mocked(approve).mockRejectedValue(new Error("rejected"));

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onUserSigningApprovalError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("user-signing-approval-error", onUserSigningApprovalError);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onUserSigningApprovalError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
    expect(simulateContract).not.toHaveBeenCalled();
  });

  it("should emit 'approve-transaction-reverted' when approval reverts", async function () {
    mockReadContractFor({ approvalRequired: true });
    vi.mocked(allowance).mockResolvedValue(0n);
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: "reverted",
    } as TransactionReceipt);

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onApproveTransactionReverted = vi.fn();
    const onPreSend = vi.fn();
    const onSettled = vi.fn();
    emitter.on("approve-transaction-reverted", onApproveTransactionReverted);
    emitter.on("pre-send", onPreSend);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onApproveTransactionReverted).toHaveBeenCalledOnce();
    expect(onPreSend).not.toHaveBeenCalled();
    expect(simulateContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'send-failed' when approval receipt fetch fails", async function () {
    mockReadContractFor({ approvalRequired: true });
    vi.mocked(allowance).mockResolvedValue(0n);
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("receipt error"),
    );

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onSendFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("send-failed", onSendFailed);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onSendFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-send-error' when send signing fails", async function () {
    mockReadContractFor({ approvalRequired: false });
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockRejectedValue(new Error("rejected"));

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onPreSend = vi.fn();
    const onUserSigningSendError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-send", onPreSend);
    emitter.on("user-signing-send-error", onUserSigningSendError);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onPreSend).toHaveBeenCalledOnce();
    expect(onUserSigningSendError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'send-transaction-reverted' when send transaction reverts", async function () {
    mockReadContractFor({ approvalRequired: false });
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: "reverted",
    } as TransactionReceipt);

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onSendTransactionReverted = vi.fn();
    const onSendTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("send-transaction-reverted", onSendTransactionReverted);
    emitter.on("send-transaction-succeeded", onSendTransactionSucceeded);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onSendTransactionReverted).toHaveBeenCalledOnce();
    expect(onSendTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'send-failed' when send receipt fetch fails", async function () {
    mockReadContractFor({ approvalRequired: false });
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as never);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("receipt error"),
    );

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onSendFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("send-failed", onSendFailed);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onSendFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when simulateContract throws", async function () {
    mockReadContractFor({ approvalRequired: false });
    vi.mocked(simulateContract).mockRejectedValue(new Error("simulate boom"));

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when approvalRequired read throws", async function () {
    vi.mocked(readContract).mockRejectedValue(new Error("rpc boom"));

    const { emitter, promise } = send(mockWalletClient, validParameters);
    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("send-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
