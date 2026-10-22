import {
  type Address,
  decodeFunctionData,
  maxUint256,
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
import { maxRedeem } from "viem-erc7540/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { targetYieldEarnVaultAbi } from "../../src/abi/targetYieldEarnVaultAbi.ts";
import { getIsShutdown } from "../../src/actions/public/getIsShutdown.ts";
import {
  claimRedeem,
  encodeClaimRedeem,
} from "../../src/actions/wallet/claimRedeem.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("viem-erc7540/actions", () => ({
  maxRedeem: vi.fn(),
}));

vi.mock("../../src/actions/public/getIsShutdown.ts", () => ({
  getIsShutdown: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as unknown as WalletClient;

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  controller: "0x1111111111111111111111111111111111111111" as Address,
  receiver: "0x2222222222222222222222222222222222222222" as Address,
  shares: BigInt(1000),
};

const otherController = "0x3333333333333333333333333333333333333333" as Address;

const rpcError = new Error("RPC error");

const successReceipt = { status: "success" } as TransactionReceipt;

describe("claimRedeem", function () {
  beforeEach(function () {
    vi.mocked(getIsShutdown).mockResolvedValue(false);
    vi.mocked(maxRedeem).mockResolvedValue(validParameters.shares);
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
    "should emit 'claim-redeem-failed-validation' if $name",
    async function ({ client, reason }) {
      const { emitter, promise } = claimRedeem(
        client as unknown as WalletClient,
        validParameters,
      );

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("claim-redeem-failed-validation", onFailedValidation);
      emitter.on("claim-redeem-settled", onSettled);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

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
      name: "receiver address is invalid",
      parameters: { receiver: zeroAddress },
      reason: "Invalid receiver address",
    },
    {
      name: "shares is not a bigint",
      parameters: { shares: 1000 },
      reason: "Shares must be a bigint",
    },
    {
      name: "shares is zero",
      parameters: { shares: BigInt(0) },
      reason: "Shares must be greater than 0",
    },
  ])(
    "should emit 'claim-redeem-failed-validation' if $name",
    async function ({ parameters, reason }) {
      const { emitter, promise } = claimRedeem(mockWalletClient, {
        ...validParameters,
        ...(parameters as Partial<typeof validParameters>),
      });

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("claim-redeem-failed-validation", onFailedValidation);
      emitter.on("claim-redeem-settled", onSettled);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(writeContract).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it.each([
    {
      claimableShares: validParameters.shares,
      isShutdown: true,
      name: "the vault is shut down",
      reason: "Vault is shut down",
    },
    {
      claimableShares: BigInt(0),
      isShutdown: false,
      name: "there is no claimable redeem",
      reason: "No claimable redeem",
    },
    {
      claimableShares: validParameters.shares - BigInt(1),
      isShutdown: false,
      name: "shares exceed the claimable redeem",
      reason: "Shares exceed the claimable redeem",
    },
  ])(
    "should emit 'claim-redeem-failed-validation' if $name",
    async function ({ claimableShares, isShutdown, reason }) {
      vi.mocked(getIsShutdown).mockResolvedValue(isShutdown);
      vi.mocked(maxRedeem).mockResolvedValue(claimableShares);

      const { emitter, promise } = claimRedeem(
        mockWalletClient,
        validParameters,
      );

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("claim-redeem-failed-validation", onFailedValidation);
      emitter.on("claim-redeem-settled", onSettled);

      await promise;

      expect(getIsShutdown).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
        address: validParameters.address,
      });
      expect(maxRedeem).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
        address: validParameters.address,
        owner: validParameters.controller,
      });
      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(writeContract).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should emit 'claim-redeem-failed-validation' if shares is maxUint256 and there is no claimable redeem", async function () {
    vi.mocked(maxRedeem).mockResolvedValue(BigInt(0));

    const { emitter, promise } = claimRedeem(mockWalletClient, {
      ...validParameters,
      shares: maxUint256,
    });

    const onFailedValidation = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-redeem-failed-validation", onFailedValidation);
    emitter.on("claim-redeem-settled", onSettled);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "No claimable redeem",
    );
    expect(writeContract).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it.each([
    {
      mockRead: () => vi.mocked(getIsShutdown).mockRejectedValueOnce(rpcError),
      name: "getIsShutdown",
    },
    {
      mockRead: () => vi.mocked(readContract).mockRejectedValueOnce(rpcError),
      name: "isOperator",
    },
    {
      mockRead: () => vi.mocked(maxRedeem).mockRejectedValueOnce(rpcError),
      name: "maxRedeem",
    },
  ])(
    "should emit 'unexpected-error' when the $name read fails",
    async function ({ mockRead }) {
      mockRead();

      const { emitter, promise } = claimRedeem(mockWalletClient, {
        ...validParameters,
        controller: otherController,
      });

      const onUnexpectedError = vi.fn();
      const onSettled = vi.fn();

      emitter.on("unexpected-error", onUnexpectedError);
      emitter.on("claim-redeem-settled", onSettled);

      await promise;

      expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(rpcError);
      expect(writeContract).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should emit 'claim-redeem-failed-validation' if the account is not the controller or its operator", async function () {
    vi.mocked(readContract).mockResolvedValue(false);

    const { emitter, promise } = claimRedeem(mockWalletClient, {
      ...validParameters,
      controller: otherController,
    });

    const onFailedValidation = vi.fn();

    emitter.on("claim-redeem-failed-validation", onFailedValidation);

    await promise;

    expect(readContract).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [otherController, mockWalletClient.account!.address],
      functionName: "isOperator",
    });
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Account is not the controller or its operator",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("should claim for a controller when the account is its operator", async function () {
    vi.mocked(readContract).mockResolvedValue(true);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = claimRedeem(mockWalletClient, {
      ...validParameters,
      controller: otherController,
    });

    await promise;

    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          validParameters.shares,
          validParameters.receiver,
          otherController,
        ],
      }),
    );
  });

  it("should not read the operator status when the account is the controller", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = claimRedeem(mockWalletClient, validParameters);

    await promise;

    expect(readContract).not.toHaveBeenCalled();
  });

  it("should emit success events when the claim succeeds", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { emitter, promise } = claimRedeem(mockWalletClient, validParameters);

    const onPreClaimRedeem = vi.fn();
    const onUserSignedClaimRedeem = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-claim-redeem", onPreClaimRedeem);
    emitter.on("user-signed-claim-redeem", onUserSignedClaimRedeem);
    emitter.on("claim-redeem-transaction-succeeded", onTransactionSucceeded);
    emitter.on("claim-redeem-settled", onSettled);

    await promise;

    expect(onPreClaimRedeem).toHaveBeenCalledOnce();
    expect(onUserSignedClaimRedeem).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      abi: expect.anything(),
      account: mockWalletClient.account,
      address: validParameters.address,
      args: [
        validParameters.shares,
        validParameters.receiver,
        validParameters.controller,
      ],
      chain: mockWalletClient.chain,
      functionName: "redeem",
    });
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should default the receiver to the controller", async function () {
    const { address, shares } = validParameters;

    vi.mocked(readContract).mockResolvedValue(true);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = claimRedeem(mockWalletClient, {
      address,
      controller: otherController,
      shares,
    });

    await promise;

    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({
        args: [shares, otherController, otherController],
      }),
    );
  });

  it("should pass maxUint256 through to claim the whole request", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = claimRedeem(mockWalletClient, {
      ...validParameters,
      shares: maxUint256,
    });

    await promise;

    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          maxUint256,
          validParameters.receiver,
          validParameters.controller,
        ],
      }),
    );
  });

  it("should emit 'user-signing-claim-redeem-error' when signing fails", async function () {
    const signingError = new Error("Signing error");
    vi.mocked(writeContract).mockRejectedValue(signingError);

    const { emitter, promise } = claimRedeem(mockWalletClient, validParameters);

    const onPreClaimRedeem = vi.fn();
    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-claim-redeem", onPreClaimRedeem);
    emitter.on("user-signing-claim-redeem-error", onSigningError);
    emitter.on("claim-redeem-settled", onSettled);

    await promise;

    expect(onPreClaimRedeem).toHaveBeenCalledOnce();
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(signingError);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-redeem-failed' when waiting for the receipt fails", async function () {
    const receiptError = new Error("Receipt error");
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(receiptError);

    const { emitter, promise } = claimRedeem(mockWalletClient, validParameters);

    const onFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-redeem-failed", onFailed);
    emitter.on("claim-redeem-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(receiptError);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-redeem-transaction-reverted' when the transaction reverts", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claimRedeem(mockWalletClient, validParameters);

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-redeem-transaction-reverted", onTransactionReverted);
    emitter.on("claim-redeem-transaction-succeeded", onTransactionSucceeded);
    emitter.on("claim-redeem-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' and settle when params is not defined", async function () {
    const { emitter, promise } = claimRedeem(
      mockWalletClient,
      // @ts-expect-error testing a missing params object
      undefined,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("claim-redeem-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(TypeError),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});

describe("encodeClaimRedeem", function () {
  it("defaults the receiver to the controller", function () {
    const { args, functionName } = decodeFunctionData({
      abi: targetYieldEarnVaultAbi,
      data: encodeClaimRedeem({
        address: validParameters.address,
        controller: validParameters.controller,
        shares: validParameters.shares,
      }),
    });

    expect(functionName).toBe("redeem");
    expect(args).toEqual([
      validParameters.shares,
      validParameters.controller,
      validParameters.controller,
    ]);
  });
});
