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
import { allowance, approve } from "viem-erc20/actions";
import { describe, expect, it, vi } from "vitest";

import { supplyCollateral } from "../../src/actions/wallet/supplyCollateral";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
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
};

describe("supplyCollateral", function () {
  it("should emit 'supply-collateral-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = supplyCollateral(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: sepolia,
    } as unknown as WalletClient;

    const { emitter, promise } = supplyCollateral(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = supplyCollateral(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if Morpho address is invalid", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      address: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid Morpho address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if Morpho address is zero address", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      address: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid Morpho address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if market ID is zero hash", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      marketId: zeroHash,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Market ID cannot be empty or zero",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if onBehalf address is invalid", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      onBehalf: "invalid",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid onBehalf address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if onBehalf address is zero address", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      onBehalf: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid onBehalf address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if amount is not a bigint", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      amount: 1000,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if amount is zero", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      amount: BigInt(0),
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if amount is negative", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      amount: BigInt(-1),
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Amount must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if approveAmount is not a bigint", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      // @ts-expect-error - Testing invalid input
      approveAmount: 1000,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Approve amount must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed-validation' if approveAmount is less than amount", async function () {
    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      approveAmount: validParameters.amount - BigInt(1),
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("supply-collateral-failed-validation", onFailedValidation);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Approve amount must be greater than or equal to amount",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should skip approval if allowance is sufficient and proceed to supply collateral", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onPreSupplyCollateral = vi.fn();
    const onUserSignedSupplyCollateral = vi.fn();
    const onSupplyCollateralTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("pre-supply-collateral", onPreSupplyCollateral);
    emitter.on("user-signed-supply-collateral", onUserSignedSupplyCollateral);
    emitter.on(
      "supply-collateral-transaction-succeeded",
      onSupplyCollateralTransactionSucceeded,
    );
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onPreApprove).not.toHaveBeenCalled();
    expect(onPreSupplyCollateral).toHaveBeenCalledOnce();
    expect(onUserSignedSupplyCollateral).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(
      onSupplyCollateralTransactionSucceeded,
    ).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(approve).not.toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve first if allowance is insufficient, then supply collateral", async function () {
    const successReceipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(successReceipt)
      .mockResolvedValueOnce(successReceipt);

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionSucceeded = vi.fn();
    const onPreSupplyCollateral = vi.fn();
    const onUserSignedSupplyCollateral = vi.fn();
    const onSupplyCollateralTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-succeeded", onApproveTransactionSucceeded);
    emitter.on("pre-supply-collateral", onPreSupplyCollateral);
    emitter.on("user-signed-supply-collateral", onUserSignedSupplyCollateral);
    emitter.on(
      "supply-collateral-transaction-succeeded",
      onSupplyCollateralTransactionSucceeded,
    );
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(onPreSupplyCollateral).toHaveBeenCalledOnce();
    expect(onUserSignedSupplyCollateral).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(
      onSupplyCollateralTransactionSucceeded,
    ).toHaveBeenCalledExactlyOnceWith(successReceipt);
    expect(approve).toHaveBeenCalledOnce();
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve with approveAmount when provided and allowance is insufficient", async function () {
    const successReceipt = {
      status: "success",
    } as TransactionReceipt;

    const approveAmount = validParameters.amount * BigInt(10);

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(successReceipt)
      .mockResolvedValueOnce(successReceipt);

    const { emitter, promise } = supplyCollateral(mockWalletClient, {
      ...validParameters,
      approveAmount,
    });

    const onSettled = vi.fn();
    emitter.on("supply-collateral-settled", onSettled);

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
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1));
    vi.mocked(approve).mockRejectedValue(new Error("Approval signing error"));

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSigningApprovalError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signing-approval-error", onUserSigningApprovalError);
    emitter.on("supply-collateral-settled", onSettled);

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

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(approvalReceipt);

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveTransactionReverted = vi.fn();
    const onPreSupplyCollateral = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-reverted", onApproveTransactionReverted);
    emitter.on("pre-supply-collateral", onPreSupplyCollateral);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      approvalReceipt,
    );
    expect(onPreSupplyCollateral).not.toHaveBeenCalled();
    expect(approve).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed' when approval receipt fails", async function () {
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onSupplyCollateralFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("supply-collateral-failed", onSupplyCollateralFailed);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSupplyCollateralFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-supply-collateral-error' when signing fails", async function () {
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreSupplyCollateral = vi.fn();
    const onUserSigningSupplyCollateralError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-supply-collateral", onPreSupplyCollateral);
    emitter.on(
      "user-signing-supply-collateral-error",
      onUserSigningSupplyCollateralError,
    );
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onPreSupplyCollateral).toHaveBeenCalledOnce();
    expect(onUserSigningSupplyCollateralError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-failed' when supply collateral receipt fails", async function () {
    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreSupplyCollateral = vi.fn();
    const onUserSignedSupplyCollateral = vi.fn();
    const onSupplyCollateralFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-supply-collateral", onPreSupplyCollateral);
    emitter.on("user-signed-supply-collateral", onUserSignedSupplyCollateral);
    emitter.on("supply-collateral-failed", onSupplyCollateralFailed);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onPreSupplyCollateral).toHaveBeenCalledOnce();
    expect(onUserSignedSupplyCollateral).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(onSupplyCollateralFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'supply-collateral-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(readContract).mockResolvedValue(mockMarketParams);
    vi.mocked(allowance).mockResolvedValue(validParameters.amount);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onPreSupplyCollateral = vi.fn();
    const onUserSignedSupplyCollateral = vi.fn();
    const onSupplyCollateralTransactionReverted = vi.fn();
    const onSupplyCollateralTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-supply-collateral", onPreSupplyCollateral);
    emitter.on("user-signed-supply-collateral", onUserSignedSupplyCollateral);
    emitter.on(
      "supply-collateral-transaction-reverted",
      onSupplyCollateralTransactionReverted,
    );
    emitter.on(
      "supply-collateral-transaction-succeeded",
      onSupplyCollateralTransactionSucceeded,
    );
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onPreSupplyCollateral).toHaveBeenCalledOnce();
    expect(onUserSignedSupplyCollateral).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(
      onSupplyCollateralTransactionReverted,
    ).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onSupplyCollateralTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' when readContract fails", async function () {
    vi.mocked(readContract).mockRejectedValue(
      new Error("Failed to read contract"),
    );

    const { emitter, promise } = supplyCollateral(
      mockWalletClient,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("supply-collateral-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
