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

import { borrowAssets } from "../../src/actions/wallet/borrowAssets";

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

describe("borrowAssets", function () {
  it("should emit 'borrow-assets-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = borrowAssets(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: sepolia,
    } as unknown as WalletClient;

    const { emitter, promise } = borrowAssets(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = borrowAssets(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if Morpho address is invalid", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      address: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid Morpho address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if Morpho address is zero address", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      address: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid Morpho address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if market ID is zero hash", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      marketId: zeroHash,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Market ID cannot be empty or zero",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if onBehalf address is invalid", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      onBehalf: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid onBehalf address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if onBehalf address is zero address", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      onBehalf: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid onBehalf address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if receiver address is invalid", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      receiver: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid receiver address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if receiver address is zero address", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      receiver: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid receiver address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if amount is not a bigint", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      amount: 1000,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if amount is zero", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      amount: BigInt(0),
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed-validation' if amount is negative", async function () {
    const { emitter, promise } = borrowAssets(mockWalletClient, {
      ...validParameters,
      amount: BigInt(-1),
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("borrow-assets-failed-validation", onFailedValidation);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should resolve market params and borrow successfully", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = borrowAssets(
      mockWalletClient,
      validParameters,
    );

    const onPreBorrowAssets = vi.fn();
    const onUserSignedBorrowAssets = vi.fn();
    const onBorrowAssetsTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-borrow-assets", onPreBorrowAssets);
    emitter.on("user-signed-borrow-assets", onUserSignedBorrowAssets);
    emitter.on(
      "borrow-assets-transaction-succeeded",
      onBorrowAssetsTransactionSucceeded,
    );
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(readContract).toHaveBeenCalledOnce();
    expect(onPreBorrowAssets).toHaveBeenCalledOnce();
    expect(onUserSignedBorrowAssets).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onBorrowAssetsTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    );
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-borrow-assets-error' when signing fails", async function () {
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = borrowAssets(
      mockWalletClient,
      validParameters,
    );

    const onPreBorrowAssets = vi.fn();
    const onUserSigningBorrowAssetsError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-borrow-assets", onPreBorrowAssets);
    emitter.on(
      "user-signing-borrow-assets-error",
      onUserSigningBorrowAssetsError,
    );
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onPreBorrowAssets).toHaveBeenCalledOnce();
    expect(onUserSigningBorrowAssetsError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-failed' when receipt fails", async function () {
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = borrowAssets(
      mockWalletClient,
      validParameters,
    );

    const onPreBorrowAssets = vi.fn();
    const onUserSignedBorrowAssets = vi.fn();
    const onBorrowAssetsFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-borrow-assets", onPreBorrowAssets);
    emitter.on("user-signed-borrow-assets", onUserSignedBorrowAssets);
    emitter.on("borrow-assets-failed", onBorrowAssetsFailed);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onPreBorrowAssets).toHaveBeenCalledOnce();
    expect(onUserSignedBorrowAssets).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onBorrowAssetsFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'borrow-assets-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = borrowAssets(
      mockWalletClient,
      validParameters,
    );

    const onPreBorrowAssets = vi.fn();
    const onUserSignedBorrowAssets = vi.fn();
    const onBorrowAssetsTransactionReverted = vi.fn();
    const onBorrowAssetsTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-borrow-assets", onPreBorrowAssets);
    emitter.on("user-signed-borrow-assets", onUserSignedBorrowAssets);
    emitter.on(
      "borrow-assets-transaction-reverted",
      onBorrowAssetsTransactionReverted,
    );
    emitter.on(
      "borrow-assets-transaction-succeeded",
      onBorrowAssetsTransactionSucceeded,
    );
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onPreBorrowAssets).toHaveBeenCalledOnce();
    expect(onUserSignedBorrowAssets).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onBorrowAssetsTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      receipt,
    );
    expect(onBorrowAssetsTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when readContract fails", async function () {
    vi.mocked(readContract).mockRejectedValue(
      new Error("Failed to read contract"),
    );

    const { emitter, promise } = borrowAssets(
      mockWalletClient,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("borrow-assets-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
