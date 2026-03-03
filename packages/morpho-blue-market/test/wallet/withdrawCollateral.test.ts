import {
  type Address,
  type Hash,
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
import { describe, expect, it, vi } from "vitest";

import { withdrawCollateral } from "../../src/actions/wallet/withdrawCollateral";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as unknown as WalletClient;

const mockMarketParams = [
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", // loanToken
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", // collateralToken
  "0xcccccccccccccccccccccccccccccccccccccccc", // oracle
  "0xdddddddddddddddddddddddddddddddddddddd", // irm
  BigInt(900000000000000000), // lltv
] as const;

const validParameters = {
  address: "0x3333333333333333333333333333333333333333" as Address,
  amount: BigInt(1000),
  marketId:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as Hash,
  onBehalf: "0x1111111111111111111111111111111111111111" as Address,
  receiver: "0x2222222222222222222222222222222222222222" as Address,
};

describe("withdrawCollateral", function () {
  it("should emit 'withdraw-collateral-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = withdrawCollateral(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: sepolia,
    } as unknown as WalletClient;

    const { emitter, promise } = withdrawCollateral(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = withdrawCollateral(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if Morpho address is invalid", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      address: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid Morpho address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if Morpho address is zero address", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      address: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid Morpho address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if market ID is zero hash", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      marketId: zeroHash,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Market ID cannot be empty or zero",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if onBehalf address is invalid", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      onBehalf: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid onBehalf address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if onBehalf address is zero address", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      onBehalf: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid onBehalf address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if receiver address is invalid", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      receiver: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid receiver address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if receiver address is zero address", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      receiver: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid receiver address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if amount is not a bigint", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      amount: 1000,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if amount is zero", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      amount: BigInt(0),
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed-validation' if amount is negative", async function () {
    const { emitter, promise } = withdrawCollateral(mockWalletClient, {
      ...validParameters,
      amount: BigInt(-1),
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("withdraw-collateral-failed-validation", onFailedValidation);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should resolve market params and withdraw collateral successfully", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = withdrawCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreWithdrawCollateral = vi.fn();
    const onUserSignedWithdrawCollateral = vi.fn();
    const onWithdrawCollateralTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-withdraw-collateral", onPreWithdrawCollateral);
    emitter.on(
      "user-signed-withdraw-collateral",
      onUserSignedWithdrawCollateral,
    );
    emitter.on(
      "withdraw-collateral-transaction-succeeded",
      onWithdrawCollateralTransactionSucceeded,
    );
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(readContract).toHaveBeenCalledOnce();
    expect(onPreWithdrawCollateral).toHaveBeenCalledOnce();
    expect(onUserSignedWithdrawCollateral).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(
      onWithdrawCollateralTransactionSucceeded,
    ).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-withdraw-collateral-error' when signing fails", async function () {
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = withdrawCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreWithdrawCollateral = vi.fn();
    const onUserSigningWithdrawCollateralError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-withdraw-collateral", onPreWithdrawCollateral);
    emitter.on(
      "user-signing-withdraw-collateral-error",
      onUserSigningWithdrawCollateralError,
    );
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onPreWithdrawCollateral).toHaveBeenCalledOnce();
    expect(
      onUserSigningWithdrawCollateralError,
    ).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-failed' when receipt fails", async function () {
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = withdrawCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreWithdrawCollateral = vi.fn();
    const onUserSignedWithdrawCollateral = vi.fn();
    const onWithdrawCollateralFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-withdraw-collateral", onPreWithdrawCollateral);
    emitter.on(
      "user-signed-withdraw-collateral",
      onUserSignedWithdrawCollateral,
    );
    emitter.on("withdraw-collateral-failed", onWithdrawCollateralFailed);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onPreWithdrawCollateral).toHaveBeenCalledOnce();
    expect(onUserSignedWithdrawCollateral).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(onWithdrawCollateralFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'withdraw-collateral-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = withdrawCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreWithdrawCollateral = vi.fn();
    const onUserSignedWithdrawCollateral = vi.fn();
    const onWithdrawCollateralTransactionReverted = vi.fn();
    const onWithdrawCollateralTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-withdraw-collateral", onPreWithdrawCollateral);
    emitter.on(
      "user-signed-withdraw-collateral",
      onUserSignedWithdrawCollateral,
    );
    emitter.on(
      "withdraw-collateral-transaction-reverted",
      onWithdrawCollateralTransactionReverted,
    );
    emitter.on(
      "withdraw-collateral-transaction-succeeded",
      onWithdrawCollateralTransactionSucceeded,
    );
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onPreWithdrawCollateral).toHaveBeenCalledOnce();
    expect(onUserSignedWithdrawCollateral).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(
      onWithdrawCollateralTransactionReverted,
    ).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onWithdrawCollateralTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when readContract fails", async function () {
    vi.mocked(readContract).mockRejectedValue(
      new Error("Failed to read contract"),
    );

    const { emitter, promise } = withdrawCollateral(
      mockWalletClient,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("withdraw-collateral-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
