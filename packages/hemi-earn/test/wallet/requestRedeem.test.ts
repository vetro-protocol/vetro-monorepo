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
import { quoteRedeem } from "../../src/actions/public/quoteRedeem.ts";
import {
  encodeRequestRedeem,
  requestRedeem,
} from "../../src/actions/wallet/requestRedeem.ts";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
  balanceOf: vi.fn(),
}));

const share = "0x4444444444444444444444444444444444444444" as Address;

vi.mock("../../src/actions/public/getAssetData.ts", () => ({
  getAssetData: vi.fn().mockResolvedValue({
    enabled: true,
    remoteAsset: "0x5555555555555555555555555555555555555555",
    remoteShare: "0x6666666666666666666666666666666666666666",
    share: "0x4444444444444444444444444444444444444444",
  }),
}));

vi.mock("../../src/actions/public/quoteRedeem.ts", () => ({
  quoteRedeem: vi.fn(),
}));

const account = "0x1111111111111111111111111111111111111111" as Address;

const mockWalletClient = {
  account: { address: account },
  chain: hemi,
} as unknown as WalletClient;

const validParameters = {
  address: "0x000000000000000000000000000000000000bEEF" as Address,
  asset: "0x000000000000000000000000000000000000dEaD" as Address,
  assetsOutMin: BigInt(95),
  callbackFee: BigInt(3),
  isInstant: true,
  operator: "0x2222222222222222222222222222222222222222" as Address,
  receiver: "0x3333333333333333333333333333333333333333" as Address,
  shares: BigInt(100),
};

const expectedArgs = [
  validParameters.asset,
  validParameters.shares,
  validParameters.assetsOutMin,
  validParameters.receiver,
  validParameters.operator,
  true,
  validParameters.callbackFee,
  validParameters.isInstant,
];

describe("requestRedeem", function () {
  it("emits 'withdraw-failed-validation' when wallet client chain is not defined", async function () {
    const walletClientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = requestRedeem(
      walletClientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "chain is not defined on wallet",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'withdraw-failed-validation' when wallet client account is not defined", async function () {
    const walletClientWithoutAccount = {
      chain: hemi,
    } as unknown as WalletClient;

    const { emitter, promise } = requestRedeem(
      walletClientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "account is not defined on wallet",
    );
  });

  it("emits 'withdraw-failed-validation' when shares is zero", async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(1000));

    const { emitter, promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      shares: BigInt(0),
    });

    const onFailedValidation = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "invalid shares amount",
    );
  });

  it("emits 'withdraw-failed-validation' when shares is not a bigint", async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(1000));

    const { emitter, promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error testing a runtime guard for untyped callers
      shares: "100",
    });

    const onFailedValidation = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "invalid shares amount",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it.each(["operator", "receiver"] as const)(
    "emits 'withdraw-failed-validation' and sends no transaction when %s is the zero address",
    async function (field) {
      vi.mocked(balanceOf).mockResolvedValue(BigInt(1000));

      const { emitter, promise } = requestRedeem(mockWalletClient, {
        ...validParameters,
        [field]: zeroAddress,
      });

      const onFailedValidation = vi.fn();
      emitter.on("withdraw-failed-validation", onFailedValidation);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
        `invalid ${field}`,
      );
      expect(approve).not.toHaveBeenCalled();
      expect(writeContract).not.toHaveBeenCalled();
    },
  );

  it("emits 'withdraw-failed-validation' when shares exceed balance", async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(10));

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "insufficient shares balance",
    );
  });

  it("emits 'withdraw-failed-validation' when the asset is disabled", async function () {
    vi.mocked(getAssetData).mockResolvedValueOnce({
      enabled: false,
      remoteAsset: "0x5555555555555555555555555555555555555555",
      remoteShare: "0x6666666666666666666666666666666666666666",
      share: "0x4444444444444444444444444444444444444444",
    });
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "asset is disabled",
    );
    expect(getAssetData).toHaveBeenCalledWith(mockWalletClient, {
      address: validParameters.address,
      asset: validParameters.asset,
    });
  });

  it("emits 'withdraw-failed-validation' and sends no transaction when the asset data read fails", async function () {
    vi.mocked(getAssetData).mockRejectedValueOnce(new Error("rpc error"));

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "failed to validate inputs",
    );
    expect(balanceOf).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("reads the balance of the share token from the Router asset data", async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(10));

    const { promise } = requestRedeem(mockWalletClient, validParameters);

    await promise;

    expect(getAssetData).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
      asset: validParameters.asset,
    });
    expect(balanceOf).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      account,
      address: share,
    });
  });

  it("emits 'withdraw-failed-validation' when balance read fails", async function () {
    vi.mocked(balanceOf).mockRejectedValue(new Error("rpc error"));

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("withdraw-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "failed to validate inputs",
    );
  });

  it("emits nothing after 'withdraw-settled' when allowance fails before the quote", async function () {
    let rejectQuote: (error: Error) => void = () => undefined;
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockReturnValue(
      new Promise(function (_resolve, reject) {
        rejectQuote = reject;
      }),
    );
    vi.mocked(allowance).mockRejectedValue(new Error("allowance error"));

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onQuoteFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("quote-failed", onQuoteFailed);
    emitter.on("withdraw-settled", onSettled);

    await promise;
    rejectQuote(new Error("quote error"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onSettled).toHaveBeenCalledOnce();
    expect(onQuoteFailed).not.toHaveBeenCalled();
  });

  it("emits 'quote-failed' when quoteRedeem throws", async function () {
    const error = new Error("quote error");
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(allowance).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockRejectedValue(error);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreQuote = vi.fn();
    const onQuoteFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-quote", onPreQuote);
    emitter.on("quote-failed", onQuoteFailed);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onPreQuote).toHaveBeenCalledOnce();
    expect(onQuoteFailed).toHaveBeenCalledExactlyOnceWith(error);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("happy path: quote, skip approve, submit, succeed", async function () {
    const receipt = { status: "success" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(42));
    vi.mocked(allowance).mockResolvedValue(validParameters.shares);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onQuoteSucceeded = vi.fn();
    const onPreWithdraw = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("quote-succeeded", onQuoteSucceeded);
    emitter.on("pre-withdraw", onPreWithdraw);
    emitter.on("withdraw-transaction-succeeded", onSucceeded);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onQuoteSucceeded).toHaveBeenCalledExactlyOnceWith(BigInt(42));
    expect(onPreWithdraw).toHaveBeenCalledOnce();
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(balanceOf).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      account,
      address: share,
    });
    expect(quoteRedeem).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
      asset: validParameters.asset,
      callbackFee: validParameters.callbackFee,
      isInstant: validParameters.isInstant,
      shares: validParameters.shares,
    });
    expect(allowance).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: share,
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
        functionName: "requestRedeem",
        value: BigInt(42),
      }),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("fails loudly when approvalAmount is below the requested shares", async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(7));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));

    const { emitter, promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      approvalAmount: validParameters.shares - BigInt(1),
    });

    const onUnexpectedError = vi.fn();
    emitter.on("unexpected-error", onUnexpectedError);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      new Error("approval amount 99 is below the required 100"),
    );
    expect(approve).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("approves approvalAmount instead of shares when given", async function () {
    const approvalReceipt = { status: "success" } as TransactionReceipt;
    const withdrawReceipt = { status: "success" } as TransactionReceipt;
    const approvalAmount = validParameters.shares * BigInt(10);

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(7));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(approvalReceipt)
      .mockResolvedValueOnce(withdrawReceipt);

    const { promise } = requestRedeem(mockWalletClient, {
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
      expect.objectContaining({
        args: expectedArgs,
      }),
    );
  });

  it("emits 'user-signing-approval-error' when the approval signing fails", async function () {
    const error = new Error("user rejected");

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockRejectedValue(error);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("user-signing-approval-error", onSigningError);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(error);
    expect(writeContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'withdraw-failed' when the approval receipt fails", async function () {
    const error = new Error("receipt error");

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValueOnce(error);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("withdraw-failed", onFailed);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(error);
    expect(writeContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'user-signing-withdraw-error' when request signing fails", async function () {
    const error = new Error("user rejected");
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(validParameters.shares);
    vi.mocked(writeContract).mockRejectedValue(error);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("user-signing-withdraw-error", onSigningError);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(error);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'withdraw-failed' when the request receipt wait fails", async function () {
    const error = new Error("receipt timeout");
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(validParameters.shares);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(error);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onUserSigned = vi.fn();
    const onFailed = vi.fn();
    const onSettled = vi.fn();
    emitter.on("user-signed-withdraw", onUserSigned);
    emitter.on("withdraw-failed", onFailed);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onFailed).toHaveBeenCalledExactlyOnceWith(error);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'withdraw-transaction-reverted' when request tx reverts", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(validParameters.shares);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onReverted = vi.fn();
    emitter.on("withdraw-transaction-reverted", onReverted);

    await promise;

    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt);
  });
});

describe("encodeRequestRedeem", function () {
  const encodeParameters = {
    asset: validParameters.asset,
    assetsOutMin: validParameters.assetsOutMin,
    callbackFee: validParameters.callbackFee,
    isInstant: validParameters.isInstant,
    operator: validParameters.operator,
    receiver: validParameters.receiver,
    shares: validParameters.shares,
  };

  it("encodes requestRedeem with automatic=true by default", function () {
    const data = encodeRequestRedeem(encodeParameters);

    expect(decodeFunctionData({ abi: hemiEarnRouterAbi, data })).toEqual({
      args: expectedArgs,
      functionName: "requestRedeem",
    });
  });

  it("encodes the cooldown path and the given automatic and assetsOutMin values", function () {
    const data = encodeRequestRedeem({
      ...encodeParameters,
      assetsOutMin: BigInt(90),
      automatic: false,
      isInstant: false,
    });

    expect(decodeFunctionData({ abi: hemiEarnRouterAbi, data })).toEqual({
      args: [
        validParameters.asset,
        validParameters.shares,
        BigInt(90),
        validParameters.receiver,
        validParameters.operator,
        false,
        validParameters.callbackFee,
        false,
      ],
      functionName: "requestRedeem",
    });
  });
});
