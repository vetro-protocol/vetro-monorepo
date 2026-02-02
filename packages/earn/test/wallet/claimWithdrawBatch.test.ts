import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { hemiSepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { claimWithdrawBatch } from "../../src/actions/wallet/claimWithdrawBatch";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: hemiSepolia,
} as unknown as WalletClient;

const validParameters = {
  receiver: "0x2222222222222222222222222222222222222222" as Address,
  requestIds: [BigInt(1), BigInt(2), BigInt(3)],
};

describe("claimWithdrawBatch", function () {
  it("should emit 'claim-withdraw-batch-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = claimWithdrawBatch(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: hemiSepolia,
    } as unknown as WalletClient;

    const { emitter, promise } = claimWithdrawBatch(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-failed-validation' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = claimWithdrawBatch(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-failed-validation' if receiver address is not valid", async function () {
    const parameters = {
      ...validParameters,
      receiver: "invalid_receiver",
    };

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid receiver address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-failed-validation' if receiver address is zero address", async function () {
    const parameters = {
      ...validParameters,
      receiver: zeroAddress,
    };

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Receiver address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-failed-validation' if requestIds is not an array", async function () {
    const parameters = { ...validParameters, requestIds: BigInt(1) };

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Request IDs must be an array",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-failed-validation' if requestIds is empty", async function () {
    const parameters = { ...validParameters, requestIds: [] };

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Request IDs array cannot be empty",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-failed-validation' if requestIds contains non-bigint", async function () {
    const parameters = {
      ...validParameters,
      requestIds: [BigInt(1), 2, BigInt(3)],
    };

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-batch-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "All request IDs must be bigints",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit success events when claim withdraw batch succeeds", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      validParameters,
    );

    const onPreClaimWithdrawBatch = vi.fn();
    const onUserSignedClaimWithdrawBatch = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-claim-withdraw-batch", onPreClaimWithdrawBatch);
    emitter.on(
      "user-signed-claim-withdraw-batch",
      onUserSignedClaimWithdrawBatch,
    );
    emitter.on(
      "claim-withdraw-batch-transaction-succeeded",
      onTransactionSucceeded,
    );
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onPreClaimWithdrawBatch).toHaveBeenCalledOnce();
    expect(onUserSignedClaimWithdrawBatch).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-claim-withdraw-batch-error' when signing fails", async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      validParameters,
    );

    const onPreClaimWithdrawBatch = vi.fn();
    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-claim-withdraw-batch", onPreClaimWithdrawBatch);
    emitter.on("user-signing-claim-withdraw-batch-error", onSigningError);
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onPreClaimWithdrawBatch).toHaveBeenCalledOnce();
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-batch-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claimWithdrawBatch(
      mockWalletClient,
      validParameters,
    );

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on(
      "claim-withdraw-batch-transaction-reverted",
      onTransactionReverted,
    );
    emitter.on(
      "claim-withdraw-batch-transaction-succeeded",
      onTransactionSucceeded,
    );
    emitter.on("claim-withdraw-batch-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
