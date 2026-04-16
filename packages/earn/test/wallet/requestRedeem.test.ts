import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { requestRedeem } from "../../src/actions/wallet/requestRedeem";
import { stakingVaultAddresses } from "../../src/stakingVaultAddresses";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as unknown as WalletClient;

const validParameters = {
  owner: "0x2222222222222222222222222222222222222222" as Address,
  shares: BigInt(1000),
  vaultAddress: stakingVaultAddresses[0],
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

  it("should emit 'request-redeem-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: sepolia,
    } as unknown as WalletClient;

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

  it("should emit 'request-redeem-failed-validation' when client chain is not defined", async function () {
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

  it("should emit 'request-redeem-failed-validation' if vault address is invalid", async function () {
    const parameters = {
      ...validParameters,
      vaultAddress: zeroAddress,
    };

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid StakingVault address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if owner address is not valid", async function () {
    const parameters = {
      ...validParameters,
      owner: "invalid_owner",
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
      "Invalid owner address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if owner address is zero address", async function () {
    const parameters = {
      ...validParameters,
      owner: zeroAddress,
    };

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Owner address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if shares is not a bigint", async function () {
    const parameters = { ...validParameters, shares: 1000 };

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
      "Shares must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if shares is zero", async function () {
    const parameters = { ...validParameters, shares: BigInt(0) };

    const { emitter, promise } = requestRedeem(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Shares must be greater than 0",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit success events when request redeem succeeds", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onPreRequestRedeem = vi.fn();
    const onUserSignedRequestRedeem = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-request-redeem", onPreRequestRedeem);
    emitter.on("user-signed-request-redeem", onUserSignedRequestRedeem);
    emitter.on("request-redeem-transaction-succeeded", onTransactionSucceeded);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onPreRequestRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedRequestRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-request-redeem-error' when signing fails", async function () {
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

  it("should emit 'request-redeem-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-transaction-reverted", onTransactionReverted);
    emitter.on("request-redeem-transaction-succeeded", onTransactionSucceeded);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
