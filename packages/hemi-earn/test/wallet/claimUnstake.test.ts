import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { claimUnstake } from "../../src/actions/wallet/claimUnstake.ts";

vi.mock("viem/actions", () => ({
  getBalance: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

const account = "0x1111111111111111111111111111111111111111" as Address;

const mockWalletClient = {
  account: { address: account },
  chain: mainnet,
} as unknown as WalletClient;

const validParameters = {
  address: "0x000000000000000000000000000000000000dEaD" as Address,
  nativeFee: BigInt(7),
  requestId: BigInt(1),
};

describe("claimUnstake", function () {
  it("emits 'unexpected-error' when wallet client chain is not defined", async function () {
    const walletClientWithoutChain = {
      account: mockWalletClient.account,
    } as WalletClient;

    const { emitter, promise } = claimUnstake(
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
      chain: mainnet,
    } as unknown as WalletClient;

    const { emitter, promise } = claimUnstake(
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
    const { emitter, promise } = claimUnstake(mockWalletClient, {
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

  it("emits 'tx-failed-validation' when the agent address is the zero address", async function () {
    const { emitter, promise } = claimUnstake(mockWalletClient, {
      ...validParameters,
      address: zeroAddress,
    });

    const onFailedValidation = vi.fn();
    emitter.on("tx-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "invalid agent address",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("emits 'tx-failed-validation' when the agent address is invalid", async function () {
    const { emitter, promise } = claimUnstake(mockWalletClient, {
      ...validParameters,
      address: "0xnotanaddress" as Address,
    });

    const onFailedValidation = vi.fn();
    emitter.on("tx-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "invalid agent address",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("happy path: signs with the native-fee top-up and emits succeeded", async function () {
    const receipt = { status: "success" } as TransactionReceipt;

    vi.mocked(getBalance).mockResolvedValue(BigInt(1000));
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claimUnstake(
      mockWalletClient,
      validParameters,
    );

    const onUserSigned = vi.fn();
    const onSucceeded = vi.fn();
    emitter.on("user-signed-tx", onUserSigned);
    emitter.on("tx-transaction-succeeded", onSucceeded);

    await promise;

    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(getBalance).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: account,
    });
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        account: mockWalletClient.account,
        address: validParameters.address,
        args: [validParameters.requestId],
        functionName: "claimUnstake",
        value: validParameters.nativeFee,
      }),
    );
  });

  it("emits 'tx-failed' when the receipt wait fails", async function () {
    const error = new Error("receipt timeout");
    vi.mocked(getBalance).mockResolvedValue(BigInt(1000));
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(error);

    const { emitter, promise } = claimUnstake(
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

    vi.mocked(getBalance).mockResolvedValue(BigInt(1000));
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claimUnstake(
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
    vi.mocked(getBalance).mockResolvedValue(BigInt(1000));
    vi.mocked(writeContract).mockRejectedValue(error);

    const { emitter, promise } = claimUnstake(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    emitter.on("user-signing-tx-error", onSigningError);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(error);
  });

  it("emits 'tx-failed-validation' when the balance is below the fee", async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(1));

    const { emitter, promise } = claimUnstake(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();
    emitter.on("tx-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "insufficient balance for fee",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });
});
