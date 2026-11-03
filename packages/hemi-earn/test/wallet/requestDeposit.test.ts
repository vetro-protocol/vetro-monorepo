import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  decodeFunctionData,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { hemi } from "viem/chains";
import { allowance, approve, balanceOf } from "viem-erc20/actions";
import { describe, expect, it, vi } from "vitest";

import { hemiEarnRouterAbi } from "../../src/abi/hemiEarnRouterAbi.ts";
import { getAssetData } from "../../src/actions/public/getAssetData.ts";
import { quoteDeposit } from "../../src/actions/public/quoteDeposit.ts";
import {
  encodeRequestDeposit,
  requestDeposit,
} from "../../src/actions/wallet/requestDeposit.ts";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
  balanceOf: vi.fn(),
}));

vi.mock("../../src/actions/public/getAssetData.ts", () => ({
  getAssetData: vi.fn().mockResolvedValue({
    enabled: true,
    remoteAsset: "0x5555555555555555555555555555555555555555",
    remoteShare: "0x6666666666666666666666666666666666666666",
    share: "0x4444444444444444444444444444444444444444",
  }),
}));

vi.mock("../../src/actions/public/quoteDeposit.ts", () => ({
  quoteDeposit: vi.fn(),
}));

const account = "0x1111111111111111111111111111111111111111" as Address;

const mockWalletClient = {
  account: { address: account },
  chain: hemi,
} as unknown as WalletClient;

const validParameters = {
  address: "0x000000000000000000000000000000000000bEEF" as Address,
  amount: BigInt(100),
  asset: "0x000000000000000000000000000000000000dEaD" as Address,
  callbackFee: BigInt(3),
  operator: "0x2222222222222222222222222222222222222222" as Address,
  receiver: "0x3333333333333333333333333333333333333333" as Address,
  sharesOutMin: BigInt(95),
};

const expectedArgs = [
  validParameters.asset,
  validParameters.amount,
  validParameters.sharesOutMin,
  validParameters.receiver,
  validParameters.operator,
  true,
  validParameters.callbackFee,
];

describe("requestDeposit", function () {
  it("emits 'deposit-failed-validation' when wallet client chain is not defined", async function () {
    const walletClientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = requestDeposit(
      walletClientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();
    emitter.on("deposit-failed-validation", onFailedValidation);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "chain is not defined on wallet",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'deposit-failed-validation' when wallet client account is not defined", async function () {
    const walletClientWithoutAccount = {
      chain: hemi,
    } as unknown as WalletClient;

    const { emitter, promise } = requestDeposit(
      walletClientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("deposit-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "account is not defined on wallet",
    );
  });

  it("emits 'deposit-failed-validation' when amount is zero", async function () {
    const { emitter, promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      amount: BigInt(0),
    });

    const onFailedValidation = vi.fn();
    emitter.on("deposit-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "invalid amount",
    );
  });

  it("emits 'deposit-failed-validation' when amount is not a bigint", async function () {
    const { emitter, promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error testing a runtime guard for untyped callers
      amount: "100",
    });

    const onFailedValidation = vi.fn();
    emitter.on("deposit-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "invalid amount",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it.each(["operator", "receiver"] as const)(
    "emits 'deposit-failed-validation' and sends no transaction when %s is the zero address",
    async function (field) {
      vi.mocked(balanceOf).mockResolvedValue(BigInt(1000));

      const { emitter, promise } = requestDeposit(mockWalletClient, {
        ...validParameters,
        [field]: zeroAddress,
      });

      const onFailedValidation = vi.fn();
      emitter.on("deposit-failed-validation", onFailedValidation);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
        `invalid ${field}`,
      );
      expect(approve).not.toHaveBeenCalled();
      expect(writeContract).not.toHaveBeenCalled();
    },
  );

  it("emits 'deposit-failed-validation' when balance is insufficient", async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount - BigInt(1));

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("deposit-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "insufficient balance",
    );
  });

  it("emits 'deposit-failed-validation' when the asset is disabled", async function () {
    vi.mocked(getAssetData).mockResolvedValueOnce({
      enabled: false,
      remoteAsset: "0x5555555555555555555555555555555555555555",
      remoteShare: "0x6666666666666666666666666666666666666666",
      share: "0x4444444444444444444444444444444444444444",
    });
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("deposit-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "asset is disabled",
    );
    expect(getAssetData).toHaveBeenCalledWith(mockWalletClient, {
      address: validParameters.address,
      asset: validParameters.asset,
    });
  });

  it("emits 'deposit-failed-validation' when balance read throws", async function () {
    vi.mocked(balanceOf).mockRejectedValue(new Error("rpc error"));

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("deposit-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "failed to validate inputs",
    );
  });

  it("emits 'quote-failed' when quoteDeposit throws", async function () {
    const error = new Error("quote error");
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockRejectedValue(error);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onPreQuote = vi.fn();
    const onQuoteFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-quote", onPreQuote);
    emitter.on("quote-failed", onQuoteFailed);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onPreQuote).toHaveBeenCalledOnce();
    expect(onQuoteFailed).toHaveBeenCalledExactlyOnceWith(error);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits nothing after 'deposit-settled' when allowance fails before the quote", async function () {
    let rejectQuote: (error: Error) => void = () => undefined;
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockReturnValue(
      new Promise(function (_resolve, reject) {
        rejectQuote = reject;
      }),
    );
    vi.mocked(allowance).mockRejectedValue(new Error("allowance error"));

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onQuoteFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("quote-failed", onQuoteFailed);
    emitter.on("deposit-settled", onSettled);

    await promise;
    rejectQuote(new Error("quote error"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onSettled).toHaveBeenCalledOnce();
    expect(onQuoteFailed).not.toHaveBeenCalled();
  });

  it("skips approval and submits request when allowance is sufficient", async function () {
    const receipt = { status: "success" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(42));
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onQuoteSucceeded = vi.fn();
    const onCheckAllowance = vi.fn();
    const onPreApprove = vi.fn();
    const onPreDeposit = vi.fn();
    const onUserSignedDeposit = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("quote-succeeded", onQuoteSucceeded);
    emitter.on("check-allowance", onCheckAllowance);
    emitter.on("pre-approve", onPreApprove);
    emitter.on("pre-deposit", onPreDeposit);
    emitter.on("user-signed-deposit", onUserSignedDeposit);
    emitter.on("deposit-transaction-succeeded", onSucceeded);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onQuoteSucceeded).toHaveBeenCalledExactlyOnceWith(BigInt(42));
    expect(onCheckAllowance).toHaveBeenCalledOnce();
    expect(onPreApprove).not.toHaveBeenCalled();
    expect(onPreDeposit).toHaveBeenCalledOnce();
    expect(onUserSignedDeposit).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(balanceOf).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      account,
      address: validParameters.asset,
    });
    expect(quoteDeposit).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
      asset: validParameters.asset,
      assets: validParameters.amount,
      callbackFee: validParameters.callbackFee,
    });
    expect(allowance).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.asset,
      owner: account,
      spender: validParameters.address,
    });
    expect(approve).not.toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        account: mockWalletClient.account,
        address: validParameters.address,
        args: expectedArgs,
        functionName: "requestDeposit",
        value: BigInt(42),
      }),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("approves first when allowance is insufficient, then submits request", async function () {
    const approvalReceipt = { status: "success" } as TransactionReceipt;
    const depositReceipt = { status: "success" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(7));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(approvalReceipt)
      .mockResolvedValueOnce(depositReceipt);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onApproveSucceeded = vi.fn();
    const onPreDeposit = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-approve", onPreApprove);
    emitter.on("approve-transaction-succeeded", onApproveSucceeded);
    emitter.on("pre-deposit", onPreDeposit);
    emitter.on("deposit-transaction-succeeded", onSucceeded);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onApproveSucceeded).toHaveBeenCalledExactlyOnceWith(approvalReceipt);
    expect(onPreDeposit).toHaveBeenCalledOnce();
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(depositReceipt);
    expect(approve).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.asset,
      amount: validParameters.amount,
      spender: validParameters.address,
    });
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("approves approvalAmount instead of amount when given", async function () {
    const approvalReceipt = { status: "success" } as TransactionReceipt;
    const depositReceipt = { status: "success" } as TransactionReceipt;
    const approvalAmount = validParameters.amount * BigInt(10);

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(7));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(approvalReceipt)
      .mockResolvedValueOnce(depositReceipt);

    const { promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      approvalAmount,
    });

    await promise;

    expect(approve).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({ amount: approvalAmount }),
    );
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({ args: expectedArgs }),
    );
  });

  it("emits 'user-signing-approval-error' when the approval signing fails", async function () {
    const error = new Error("user rejected");

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockRejectedValue(error);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("user-signing-approval-error", onSigningError);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(error);
    expect(writeContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'deposit-failed' when the approval receipt fails", async function () {
    const error = new Error("receipt error");

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValueOnce(error);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("deposit-failed", onFailed);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(error);
    expect(writeContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'approve-transaction-reverted' when approval reverts", async function () {
    const approvalReceipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(approvalReceipt);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onApproveReverted = vi.fn();
    const onPreDeposit = vi.fn();
    const onSettled = vi.fn();
    emitter.on("approve-transaction-reverted", onApproveReverted);
    emitter.on("pre-deposit", onPreDeposit);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onApproveReverted).toHaveBeenCalledExactlyOnceWith(approvalReceipt);
    expect(onPreDeposit).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'user-signing-deposit-error' when request signing fails", async function () {
    const error = new Error("user rejected");
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(writeContract).mockRejectedValue(error);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("user-signing-deposit-error", onSigningError);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(error);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'deposit-transaction-reverted' when request tx reverts", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount);
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onReverted = vi.fn();
    const onSettled = vi.fn();
    emitter.on("deposit-transaction-reverted", onReverted);
    emitter.on("deposit-settled", onSettled);

    await promise;

    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onSettled).toHaveBeenCalledOnce();
  });
});

describe("encodeRequestDeposit", function () {
  const encodeParameters = {
    amount: validParameters.amount,
    asset: validParameters.asset,
    callbackFee: validParameters.callbackFee,
    operator: validParameters.operator,
    receiver: validParameters.receiver,
    sharesOutMin: validParameters.sharesOutMin,
  };

  it("encodes requestDeposit with automatic=true by default", function () {
    const data = encodeRequestDeposit(encodeParameters);

    expect(decodeFunctionData({ abi: hemiEarnRouterAbi, data })).toEqual({
      args: expectedArgs,
      functionName: "requestDeposit",
    });
  });

  it("encodes the given automatic and sharesOutMin values", function () {
    const data = encodeRequestDeposit({
      ...encodeParameters,
      automatic: false,
      sharesOutMin: BigInt(90),
    });

    expect(decodeFunctionData({ abi: hemiEarnRouterAbi, data })).toEqual({
      args: [
        validParameters.asset,
        validParameters.amount,
        BigInt(90),
        validParameters.receiver,
        validParameters.operator,
        false,
        validParameters.callbackFee,
      ],
      functionName: "requestDeposit",
    });
  });
});
