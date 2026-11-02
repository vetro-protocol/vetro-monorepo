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

vi.mock("../../src/actions/public/quoteRedeem.ts", () => ({
  quoteRedeem: vi.fn(),
}));

const account = "0x1111111111111111111111111111111111111111" as Address;

const mockWalletClient = {
  account: { address: account },
  chain: hemi,
} as unknown as WalletClient;

const validParameters = {
  account,
  address: "0x000000000000000000000000000000000000bEEF" as Address,
  asset: "0x000000000000000000000000000000000000dEaD" as Address,
  callbackFee: BigInt(3),
  isInstant: false,
  operator: "0x2222222222222222222222222222222222222222" as Address,
  receiver: "0x3333333333333333333333333333333333333333" as Address,
  shares: BigInt(100),
  shareToken: "0x4444444444444444444444444444444444444444" as Address,
};

const buildExpectedArgs = (shares: bigint) => [
  validParameters.asset,
  shares,
  BigInt(0),
  validParameters.receiver,
  validParameters.operator,
  true,
  validParameters.callbackFee,
  false,
];

const dustSnapBalance = BigInt(10005);
const dustSnapShares = BigInt(10000);

describe("requestRedeem", function () {
  it("emits 'unexpected-error' when wallet client chain is not defined", async function () {
    const walletClientWithoutChain = {
      account: validParameters.account,
    } as WalletClient;

    const { emitter, promise } = requestRedeem(
      walletClientWithoutChain,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("withdraw-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      new Error("Chain is not defined on wallet"),
    );
    expect(onSettled).toHaveBeenCalledOnce();
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

  it("sweeps dust when shares >= 99.9% of balance", async function () {
    const userBalance = BigInt(1000);
    const receipt = { status: "success" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(userBalance);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0));
    vi.mocked(allowance).mockResolvedValue(userBalance);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      shares: BigInt(999),
    });

    await promise;

    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({ args: buildExpectedArgs(userBalance) }),
    );
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
      address: validParameters.shareToken,
    });
    expect(quoteRedeem).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
      asset: validParameters.asset,
      callbackFee: validParameters.callbackFee,
      isInstant: validParameters.isInstant,
      shares: validParameters.shares,
    });
    expect(allowance).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.shareToken,
      owner: account,
      spender: validParameters.address,
    });
    expect(approve).not.toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        account: validParameters.account,
        address: validParameters.address,
        args: buildExpectedArgs(validParameters.shares),
        functionName: "requestRedeem",
        value: BigInt(42),
      }),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("approves the adjusted shares, not the requested ones, when the dust snap applies", async function () {
    const approvalReceipt = { status: "success" } as TransactionReceipt;
    const withdrawReceipt = { status: "success" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(dustSnapBalance);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(7));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(approvalReceipt)
      .mockResolvedValueOnce(withdrawReceipt);

    const { promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      shares: dustSnapShares,
    });

    await promise;

    expect(approve).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.shareToken,
      amount: dustSnapBalance,
      spender: validParameters.address,
    });
  });

  it("skips the dust snap when approvalAmount is below the balance", async function () {
    const approvalReceipt = { status: "success" } as TransactionReceipt;
    const withdrawReceipt = { status: "success" } as TransactionReceipt;

    vi.mocked(balanceOf).mockResolvedValue(dustSnapBalance);
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(7));
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(approvalReceipt)
      .mockResolvedValueOnce(withdrawReceipt);

    const { promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      approvalAmount: dustSnapShares,
      shares: dustSnapShares,
    });

    await promise;

    expect(approve).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({ amount: dustSnapShares }),
    );
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({ args: buildExpectedArgs(dustSnapShares) }),
    );
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

  it("approves approvalAmount instead of the adjusted shares when given", async function () {
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
        args: buildExpectedArgs(validParameters.shares),
      }),
    );
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
    callbackFee: validParameters.callbackFee,
    isInstant: false,
    operator: validParameters.operator,
    receiver: validParameters.receiver,
    shares: validParameters.shares,
  };

  it("encodes requestRedeem with automatic=true and assetsOutMin=0 by default", function () {
    const data = encodeRequestRedeem(encodeParameters);

    expect(decodeFunctionData({ abi: hemiEarnRouterAbi, data })).toEqual({
      args: buildExpectedArgs(validParameters.shares),
      functionName: "requestRedeem",
    });
  });

  it("encodes the instant path and the given automatic and assetsOutMin values", function () {
    const data = encodeRequestRedeem({
      ...encodeParameters,
      assetsOutMin: BigInt(90),
      automatic: false,
      isInstant: true,
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
        true,
      ],
      functionName: "requestRedeem",
    });
  });
});
