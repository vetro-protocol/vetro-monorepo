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

import { claimWithdraw } from "../../src/actions/wallet/claimWithdraw";
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
  receiver: "0x2222222222222222222222222222222222222222" as Address,
  requestId: BigInt(1),
  vaultAddress: stakingVaultAddresses[0],
};

describe("claimWithdraw", function () {
  it("should emit 'claim-withdraw-failed-validation' if client is not defined", async function () {
    const { emitter, promise } = claimWithdraw(
      // @ts-expect-error - Testing invalid input
      undefined,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client is not defined",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-failed-validation' if client.account is not defined", async function () {
    const clientWithoutAccount = {
      chain: sepolia,
    } as unknown as WalletClient;

    const { emitter, promise } = claimWithdraw(
      clientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Client must have an account",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-failed-validation' when client chain is not defined", async function () {
    const clientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = claimWithdraw(
      clientWithoutChain,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Chain is not defined on wallet client",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-failed-validation' if vault address is invalid", async function () {
    const parameters = {
      ...validParameters,
      vaultAddress: zeroAddress,
    };

    const { emitter, promise } = claimWithdraw(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid StakingVault address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-failed-validation' if receiver address is not valid", async function () {
    const parameters = {
      ...validParameters,
      receiver: "invalid_receiver",
    };

    const { emitter, promise } = claimWithdraw(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid receiver address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-failed-validation' if receiver address is zero address", async function () {
    const parameters = {
      ...validParameters,
      receiver: zeroAddress,
    };

    const { emitter, promise } = claimWithdraw(mockWalletClient, parameters);

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Receiver address cannot be zero address",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-failed-validation' if requestId is not a bigint", async function () {
    const parameters = { ...validParameters, requestId: 1 };

    const { emitter, promise } = claimWithdraw(
      mockWalletClient,
      // @ts-expect-error - Testing invalid input
      parameters,
    );

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-failed-validation", onFailedValidation);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Request ID must be a bigint",
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit success events when claim withdraw succeeds", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claimWithdraw(
      mockWalletClient,
      validParameters,
    );

    const onPreClaimWithdraw = vi.fn();
    const onUserSignedClaimWithdraw = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-claim-withdraw", onPreClaimWithdraw);
    emitter.on("user-signed-claim-withdraw", onUserSignedClaimWithdraw);
    emitter.on("claim-withdraw-transaction-succeeded", onTransactionSucceeded);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onPreClaimWithdraw).toHaveBeenCalledOnce();
    expect(onUserSignedClaimWithdraw).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(writeContract).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-claim-withdraw-error' when signing fails", async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = claimWithdraw(
      mockWalletClient,
      validParameters,
    );

    const onPreClaimWithdraw = vi.fn();
    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-claim-withdraw", onPreClaimWithdraw);
    emitter.on("user-signing-claim-withdraw-error", onSigningError);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onPreClaimWithdraw).toHaveBeenCalledOnce();
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-withdraw-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claimWithdraw(
      mockWalletClient,
      validParameters,
    );

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-withdraw-transaction-reverted", onTransactionReverted);
    emitter.on("claim-withdraw-transaction-succeeded", onTransactionSucceeded);
    emitter.on("claim-withdraw-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
