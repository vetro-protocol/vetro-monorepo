import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { hemi } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { cancelRedeem } from "../../src/actions/wallet/cancelRedeem.ts";

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
  account: "0x1111111111111111111111111111111111111111" as Address,
  address: "0x000000000000000000000000000000000000bEEF" as Address,
  requestId: BigInt(1),
};

describe("cancelRedeem", function () {
  it("emits 'unexpected-error' when wallet client chain is not defined", async function () {
    const walletClientWithoutChain = {
      account: validParameters.account,
    } as WalletClient;

    const { emitter, promise } = cancelRedeem(
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

  it("emits 'tx-failed-validation' when requestId is zero", async function () {
    const { emitter, promise } = cancelRedeem(mockWalletClient, {
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

    const { emitter, promise } = cancelRedeem(
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
        account: validParameters.account,
        address: validParameters.address,
        args: [validParameters.requestId],
        functionName: "cancel",
      }),
    );
  });

  it("emits 'tx-transaction-reverted' when receipt is reverted", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = cancelRedeem(
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

    const { emitter, promise } = cancelRedeem(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    emitter.on("user-signing-tx-error", onSigningError);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(error);
  });
});
