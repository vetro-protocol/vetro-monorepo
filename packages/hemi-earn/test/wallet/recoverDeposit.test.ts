import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  decodeFunctionData,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { hemi } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { hemiEarnRouterAbi } from "../../src/abi/hemiEarnRouterAbi.ts";
import {
  recoverDeposit,
  encodeRecoverDeposit,
} from "../../src/actions/wallet/recoverDeposit.ts";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: hemi,
} as unknown as WalletClient;

const validParameters = {
  address: "0x000000000000000000000000000000000000bEEF" as Address,
  requestId: BigInt(1),
};

describe("recoverDeposit", function () {
  it("emits 'unexpected-error' when wallet client chain is not defined", async function () {
    const walletClientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = recoverDeposit(
      walletClientWithoutChain,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();
    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("tx-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      new Error("Chain is not defined on wallet"),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'tx-failed-validation' when wallet client account is not defined", async function () {
    const walletClientWithoutAccount = {
      chain: hemi,
    } as unknown as WalletClient;

    const { emitter, promise } = recoverDeposit(
      walletClientWithoutAccount,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("tx-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "account is not defined on wallet",
    );
  });

  it("emits 'tx-failed-validation' when requestId is zero", async function () {
    const { emitter, promise } = recoverDeposit(mockWalletClient, {
      ...validParameters,
      requestId: BigInt(0),
    });

    const onFailedValidation = vi.fn();
    emitter.on("tx-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "invalid requestId",
    );
  });

  it("happy path: signs, waits receipt, emits succeeded", async function () {
    const receipt = { status: "success" } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = recoverDeposit(
      mockWalletClient,
      validParameters,
    );

    const onPreTx = vi.fn();
    const onUserSigned = vi.fn();
    const onSucceeded = vi.fn();
    const onSettled = vi.fn();
    emitter.on("pre-tx", onPreTx);
    emitter.on("user-signed-tx", onUserSigned);
    emitter.on("tx-transaction-succeeded", onSucceeded);
    emitter.on("tx-settled", onSettled);

    await promise;

    expect(onPreTx).toHaveBeenCalledOnce();
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onSettled).toHaveBeenCalledOnce();
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        account: mockWalletClient.account,
        address: validParameters.address,
        args: [validParameters.requestId],
        functionName: "recoverDeposit",
      }),
    );
  });

  it("emits 'tx-failed' when the receipt wait fails", async function () {
    const error = new Error("receipt timeout");
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(error);

    const { emitter, promise } = recoverDeposit(
      mockWalletClient,
      validParameters,
    );

    const onFailed = vi.fn();
    const onSucceeded = vi.fn();
    const onReverted = vi.fn();
    const onSettled = vi.fn();
    emitter.on("tx-failed", onFailed);
    emitter.on("tx-transaction-succeeded", onSucceeded);
    emitter.on("tx-transaction-reverted", onReverted);
    emitter.on("tx-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(error);
    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onReverted).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("emits 'tx-transaction-reverted' when receipt is reverted", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = recoverDeposit(
      mockWalletClient,
      validParameters,
    );

    const onReverted = vi.fn();
    emitter.on("tx-transaction-reverted", onReverted);

    await promise;

    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt);
  });

  it("emits 'user-signing-tx-error' when signing fails", async function () {
    const error = new Error("user rejected");
    vi.mocked(writeContract).mockRejectedValue(error);

    const { emitter, promise } = recoverDeposit(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    emitter.on("user-signing-tx-error", onSigningError);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(error);
  });
});

describe("encodeRecoverDeposit", function () {
  it("encodes the recoverDeposit call with the requestId", function () {
    const data = encodeRecoverDeposit({ requestId: BigInt(42) });

    expect(decodeFunctionData({ abi: hemiEarnRouterAbi, data })).toEqual({
      args: [BigInt(42)],
      functionName: "recoverDeposit",
    });
  });
});
