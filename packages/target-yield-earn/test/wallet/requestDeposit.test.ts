import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { sepolia } from "viem/chains";
import { balanceOf } from "viem-erc20/actions";
import {
  allowance,
  approve,
  asset,
  requestDeposit as erc7540RequestDeposit,
} from "viem-erc7540/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getIsPaused } from "../../src/actions/public/getIsPaused.ts";
import { getIsShutdown } from "../../src/actions/public/getIsShutdown.ts";
import { getMaxRequestDeposit } from "../../src/actions/public/getMaxRequestDeposit.ts";
import { requestDeposit } from "../../src/actions/wallet/requestDeposit.ts";
import { getIsAccountOrOperator } from "../../src/utils/getIsAccountOrOperator.ts";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  balanceOf: vi.fn(),
}));

vi.mock("viem-erc7540/actions", () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
  asset: vi.fn(),
  requestDeposit: vi.fn(),
}));

vi.mock("../../src/actions/public/getIsPaused.ts", () => ({
  getIsPaused: vi.fn(),
}));

vi.mock("../../src/actions/public/getIsShutdown.ts", () => ({
  getIsShutdown: vi.fn(),
}));

vi.mock("../../src/actions/public/getMaxRequestDeposit.ts", () => ({
  getMaxRequestDeposit: vi.fn(),
}));

vi.mock("../../src/utils/getIsAccountOrOperator.ts", () => ({
  getIsAccountOrOperator: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as unknown as WalletClient;

const token = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address;

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  assets: BigInt(1000),
  controller: "0x1111111111111111111111111111111111111111" as Address,
  owner: "0x1111111111111111111111111111111111111111" as Address,
};

const successReceipt = { status: "success" } as TransactionReceipt;

const rpcError = new Error("RPC error");

describe("requestDeposit", function () {
  beforeEach(function () {
    vi.mocked(allowance).mockReset();
    vi.mocked(approve).mockReset();
    vi.mocked(asset).mockResolvedValue(token);
    vi.mocked(balanceOf).mockResolvedValue(validParameters.assets);
    vi.mocked(erc7540RequestDeposit).mockReset();
    vi.mocked(getIsAccountOrOperator).mockResolvedValue(true);
    vi.mocked(getIsPaused).mockResolvedValue(false);
    vi.mocked(getIsShutdown).mockResolvedValue(false);
    vi.mocked(getMaxRequestDeposit).mockResolvedValue(validParameters.assets);
    vi.mocked(waitForTransactionReceipt).mockReset();
  });

  it.each([
    {
      client: undefined,
      name: "client is not defined",
      reason: "Client is not defined",
    },
    {
      client: { chain: sepolia },
      name: "client.account is not defined",
      reason: "Client must have an account",
    },
    {
      client: { account: mockWalletClient.account },
      name: "client chain is not defined",
      reason: "Chain is not defined on wallet client",
    },
  ])(
    "should emit 'request-deposit-failed-validation' if $name",
    async function ({ client, reason }) {
      const { emitter, promise } = requestDeposit(
        client as unknown as WalletClient,
        validParameters,
      );

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("request-deposit-failed-validation", onFailedValidation);
      emitter.on("request-deposit-settled", onSettled);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it.each([
    {
      name: "the vault is paused",
      reason: "Vault is paused",
      state: "paused",
    },
    {
      name: "the vault is shut down",
      reason: "Vault is shut down",
      state: "shutdown",
    },
    {
      name: "assets exceed the max deposit request",
      reason: "Assets exceed the max deposit request",
      state: "max",
    },
  ])(
    "should emit validation and skip sending when $name",
    async function ({ reason, state }) {
      if (state === "paused") {
        vi.mocked(getIsPaused).mockResolvedValue(true);
      }
      if (state === "shutdown") {
        vi.mocked(getIsShutdown).mockResolvedValue(true);
      }
      if (state === "max") {
        vi.mocked(getMaxRequestDeposit).mockResolvedValue(
          validParameters.assets - 1n,
        );
      }
      const { emitter, promise } = requestDeposit(
        mockWalletClient,
        validParameters,
      );

      const onFailedValidation = vi.fn();
      emitter.on("request-deposit-failed-validation", onFailedValidation);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(approve).not.toHaveBeenCalled();
      expect(erc7540RequestDeposit).not.toHaveBeenCalled();
    },
  );

  it("should validate the owner's asset balance", async function () {
    const owner = "0x2222222222222222222222222222222222222222" as Address;

    vi.mocked(balanceOf).mockResolvedValue(validParameters.assets - 1n);

    const { emitter, promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      owner,
    });

    const onFailedValidation = vi.fn();
    emitter.on("request-deposit-failed-validation", onFailedValidation);

    await promise;

    expect(balanceOf).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      account: owner,
      address: token,
    });
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Owner balance is lower than assets",
    );
    expect(approve).not.toHaveBeenCalled();
    expect(erc7540RequestDeposit).not.toHaveBeenCalled();
  });

  it("should require owner or operator authorization even when allowance covers the assets", async function () {
    const owner = "0x2222222222222222222222222222222222222222" as Address;

    vi.mocked(getIsAccountOrOperator).mockResolvedValue(false);
    vi.mocked(allowance).mockResolvedValue(validParameters.assets);

    const { emitter, promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      owner,
    });

    const onFailedValidation = vi.fn();
    emitter.on("request-deposit-failed-validation", onFailedValidation);

    await promise;

    expect(getIsAccountOrOperator).toHaveBeenCalledExactlyOnceWith({
      account: mockWalletClient.account!.address,
      address: validParameters.address,
      client: mockWalletClient,
      owner,
    });
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Account is not the owner or its operator",
    );
    expect(allowance).not.toHaveBeenCalled();
    expect(erc7540RequestDeposit).not.toHaveBeenCalled();
  });

  it("should check the max deposit request for the given controller and owner", async function () {
    const controller = "0x3333333333333333333333333333333333333333" as Address;
    const owner = "0x2222222222222222222222222222222222222222" as Address;

    vi.mocked(allowance).mockResolvedValue(validParameters.assets);
    vi.mocked(erc7540RequestDeposit).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      controller,
      owner,
    });

    await promise;

    expect(getMaxRequestDeposit).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      {
        address: validParameters.address,
        controller,
        owner,
      },
    );
    expect(erc7540RequestDeposit).toHaveBeenCalledOnce();
  });

  it.each([
    {
      name: "vault address is invalid",
      parameters: { address: zeroAddress },
      reason: "Invalid vault address",
    },
    {
      name: "controller address is invalid",
      parameters: { controller: zeroAddress },
      reason: "Invalid controller address",
    },
    {
      name: "owner address is invalid",
      parameters: { owner: zeroAddress },
      reason: "Invalid owner address",
    },
    {
      name: "assets is not a bigint",
      parameters: { assets: 1000 },
      reason: "Assets must be a bigint",
    },
    {
      name: "assets is zero",
      parameters: { assets: BigInt(0) },
      reason: "Assets must be greater than 0",
    },
    {
      name: "approve amount is lower than assets",
      parameters: { approveAmount: BigInt(999) },
      reason: "Approve amount must be greater than or equal to assets",
    },
  ])(
    "should emit 'request-deposit-failed-validation' if $name",
    async function ({ parameters, reason }) {
      const { emitter, promise } = requestDeposit(mockWalletClient, {
        ...validParameters,
        ...(parameters as Partial<typeof validParameters>),
      });

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("request-deposit-failed-validation", onFailedValidation);
      emitter.on("request-deposit-settled", onSettled);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(erc7540RequestDeposit).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should skip the approval if the allowance covers the assets", async function () {
    vi.mocked(allowance).mockResolvedValue(validParameters.assets);
    vi.mocked(erc7540RequestDeposit).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onPreApprove = vi.fn();
    const onPreRequestDeposit = vi.fn();
    const onUserSignedRequestDeposit = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("pre-request-deposit", onPreRequestDeposit);
    emitter.on("user-signed-request-deposit", onUserSignedRequestDeposit);
    emitter.on("request-deposit-transaction-succeeded", onTransactionSucceeded);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(asset).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
    });
    expect(allowance).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: token,
      owner: validParameters.owner,
      spender: validParameters.address,
    });
    expect(onPreApprove).not.toHaveBeenCalled();
    expect(approve).not.toHaveBeenCalled();
    expect(onPreRequestDeposit).toHaveBeenCalledOnce();
    expect(onUserSignedRequestDeposit).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    );
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(erc7540RequestDeposit).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      validParameters,
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should approve and then request the deposit if the allowance is not enough", async function () {
    const approveAmount = BigInt(5000);

    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(erc7540RequestDeposit).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { emitter, promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      approveAmount,
    });

    const onPreApprove = vi.fn();
    const onUserSignedApproval = vi.fn();
    const onApproveSucceeded = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-approve", onPreApprove);
    emitter.on("user-signed-approval", onUserSignedApproval);
    emitter.on("approve-transaction-succeeded", onApproveSucceeded);
    emitter.on("request-deposit-transaction-succeeded", onTransactionSucceeded);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onPreApprove).toHaveBeenCalledOnce();
    expect(approve).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: token,
      amount: approveAmount,
      spender: validParameters.address,
    });
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onApproveSucceeded).toHaveBeenCalledExactlyOnceWith(successReceipt);
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should default the owner to the wallet account", async function () {
    const { owner, ...parametersWithoutOwner } = validParameters;

    vi.mocked(allowance).mockResolvedValue(validParameters.assets);
    vi.mocked(erc7540RequestDeposit).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = requestDeposit(
      mockWalletClient,
      parametersWithoutOwner,
    );

    await promise;

    expect(allowance).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: token,
      owner,
      spender: validParameters.address,
    });
    expect(erc7540RequestDeposit).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      { ...parametersWithoutOwner, owner },
    );
  });

  it("should emit 'request-deposit-failed-validation' if the owner is not the wallet account and the allowance is not enough", async function () {
    vi.mocked(allowance).mockResolvedValue(BigInt(0));

    const { emitter, promise } = requestDeposit(mockWalletClient, {
      ...validParameters,
      owner: "0x2222222222222222222222222222222222222222",
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-deposit-failed-validation", onFailedValidation);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Owner allowance is lower than assets",
    );
    expect(approve).not.toHaveBeenCalled();
    expect(erc7540RequestDeposit).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-approval-error' when signing the approval fails", async function () {
    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockRejectedValue(new Error("Signing error"));

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("user-signing-approval-error", onSigningError);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(erc7540RequestDeposit).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'approve-transaction-reverted' when the approval reverts", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(allowance).mockResolvedValue(BigInt(0));
    vi.mocked(approve).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onApproveReverted = vi.fn();
    const onSettled = vi.fn();

    emitter.on("approve-transaction-reverted", onApproveReverted);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onApproveReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(erc7540RequestDeposit).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-request-deposit-error' when signing fails", async function () {
    vi.mocked(allowance).mockResolvedValue(validParameters.assets);
    vi.mocked(erc7540RequestDeposit).mockRejectedValue(
      new Error("Signing error"),
    );

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("user-signing-request-deposit-error", onSigningError);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-deposit-failed' when waiting for the receipt fails", async function () {
    vi.mocked(allowance).mockResolvedValue(validParameters.assets);
    vi.mocked(erc7540RequestDeposit).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-deposit-failed", onFailed);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-deposit-transaction-reverted' when transaction reverts", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(allowance).mockResolvedValue(validParameters.assets);
    vi.mocked(erc7540RequestDeposit).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-deposit-transaction-reverted", onTransactionReverted);
    emitter.on("request-deposit-transaction-succeeded", onTransactionSucceeded);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it.each([
    {
      mockRead() {
        vi.mocked(getIsPaused).mockRejectedValueOnce(rpcError);
      },
      name: "getIsPaused",
    },
    {
      mockRead() {
        vi.mocked(getIsShutdown).mockRejectedValueOnce(rpcError);
      },
      name: "getIsShutdown",
    },
    {
      mockRead() {
        vi.mocked(getIsAccountOrOperator).mockRejectedValueOnce(rpcError);
      },
      name: "getIsAccountOrOperator",
    },
    {
      mockRead() {
        vi.mocked(getMaxRequestDeposit).mockRejectedValueOnce(rpcError);
      },
      name: "getMaxRequestDeposit",
    },
    {
      mockRead() {
        vi.mocked(balanceOf).mockRejectedValueOnce(rpcError);
      },
      name: "balanceOf",
    },
  ])(
    "should emit 'unexpected-error' when the $name read fails",
    async function ({ mockRead }) {
      mockRead();

      const { emitter, promise } = requestDeposit(
        mockWalletClient,
        validParameters,
      );

      const onUnexpectedError = vi.fn();
      const onSettled = vi.fn();

      emitter.on("unexpected-error", onUnexpectedError);
      emitter.on("request-deposit-settled", onSettled);

      await promise;

      expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(rpcError);
      expect(approve).not.toHaveBeenCalled();
      expect(erc7540RequestDeposit).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should emit 'unexpected-error' when reading the vault asset fails", async function () {
    vi.mocked(asset).mockRejectedValue(new Error("RPC error"));

    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      validParameters,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' and settle when params is not defined", async function () {
    const { emitter, promise } = requestDeposit(
      mockWalletClient,
      // @ts-expect-error testing a missing params object
      undefined,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("request-deposit-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(TypeError),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});
