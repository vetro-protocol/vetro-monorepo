import {
  type Address,
  decodeFunctionData,
  isAddressEqual,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { readContract, waitForTransactionReceipt } from "viem/actions";
import { sepolia } from "viem/chains";
import { erc7540Abi } from "viem-erc7540";
import {
  allowance,
  requestRedeem as erc7540RequestRedeem,
} from "viem-erc7540/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getIsShutdown } from "../../src/actions/public/getIsShutdown.ts";
import { getMaxMint } from "../../src/actions/public/getMaxMint.ts";
import { getMaxRequestRedeem } from "../../src/actions/public/getMaxRequestRedeem.ts";
import {
  encodeRequestRedeem,
  requestRedeem,
} from "../../src/actions/wallet/requestRedeem.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
}));

vi.mock("viem-erc7540/actions", () => ({
  allowance: vi.fn(),
  requestRedeem: vi.fn(),
}));

vi.mock("../../src/actions/public/getIsShutdown.ts", () => ({
  getIsShutdown: vi.fn(),
}));

vi.mock("../../src/actions/public/getMaxMint.ts", () => ({
  getMaxMint: vi.fn(),
}));

vi.mock("../../src/actions/public/getMaxRequestRedeem.ts", () => ({
  getMaxRequestRedeem: vi.fn(),
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
  owner: "0x1111111111111111111111111111111111111111" as Address,
  shares: BigInt(1000),
};

const otherOwner = "0x3333333333333333333333333333333333333333" as Address;

const rpcError = new Error("RPC error");

const successReceipt = { status: "success" } as TransactionReceipt;

function mockMaxRequestRedeem({
  ownerMax,
  vaultMax = 0n,
}: {
  ownerMax: bigint;
  vaultMax?: bigint;
}) {
  vi.mocked(getMaxRequestRedeem).mockImplementation((_, { owner }) =>
    Promise.resolve(
      isAddressEqual(owner, validParameters.address) ? vaultMax : ownerMax,
    ),
  );
}

describe("requestRedeem", function () {
  beforeEach(function () {
    vi.mocked(getIsShutdown).mockResolvedValue(false);
    vi.mocked(getMaxMint).mockResolvedValue(0n);
    mockMaxRequestRedeem({ ownerMax: validParameters.shares });
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
    "should emit 'request-redeem-failed-validation' if $name",
    async function ({ client, reason }) {
      const { emitter, promise } = requestRedeem(
        client as unknown as WalletClient,
        validParameters,
      );

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("request-redeem-failed-validation", onFailedValidation);
      emitter.on("request-redeem-settled", onSettled);

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
      name: "owner address is invalid",
      parameters: { owner: zeroAddress },
      reason: "Invalid owner address",
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
    "should emit 'request-redeem-failed-validation' if $name",
    async function ({ parameters, reason }) {
      const { emitter, promise } = requestRedeem(mockWalletClient, {
        ...validParameters,
        ...(parameters as Partial<typeof validParameters>),
      });

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("request-redeem-failed-validation", onFailedValidation);
      emitter.on("request-redeem-settled", onSettled);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(erc7540RequestRedeem).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it.each([
    {
      isShutdown: true,
      name: "the vault is shut down",
      ownerMax: validParameters.shares,
      reason: "Vault is shut down",
    },
    {
      isShutdown: false,
      name: "shares exceed the max redeem request",
      ownerMax: validParameters.shares - BigInt(1),
      reason: "Shares exceed the max redeem request",
    },
  ])(
    "should emit 'request-redeem-failed-validation' if $name",
    async function ({ isShutdown, ownerMax, reason }) {
      vi.mocked(getIsShutdown).mockResolvedValue(isShutdown);
      mockMaxRequestRedeem({ ownerMax });

      const { emitter, promise } = requestRedeem(
        mockWalletClient,
        validParameters,
      );

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("request-redeem-failed-validation", onFailedValidation);
      emitter.on("request-redeem-settled", onSettled);

      await promise;

      expect(getIsShutdown).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
        address: validParameters.address,
      });
      expect(getMaxRequestRedeem).toHaveBeenCalledExactlyOnceWith(
        mockWalletClient,
        {
          address: validParameters.address,
          controller: validParameters.controller,
          owner: validParameters.owner,
        },
      );
      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(erc7540RequestRedeem).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should accept the claimable deposit shares on top of the max redeem request", async function () {
    mockMaxRequestRedeem({ ownerMax: BigInt(400) });
    vi.mocked(getMaxMint).mockResolvedValue(BigInt(600));
    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = requestRedeem(mockWalletClient, validParameters);

    await promise;

    expect(getMaxMint).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
      controller: validParameters.controller,
    });
    expect(getMaxRequestRedeem).toHaveBeenCalledOnce();
    expect(erc7540RequestRedeem).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      validParameters,
    );
  });

  it("should accept the claimable deposit shares when the owner holds no shares and the request is not blocked", async function () {
    mockMaxRequestRedeem({ ownerMax: BigInt(0), vaultMax: BigInt(1) });
    vi.mocked(getMaxMint).mockResolvedValue(validParameters.shares);
    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = requestRedeem(mockWalletClient, validParameters);

    await promise;

    expect(getMaxRequestRedeem).toHaveBeenLastCalledWith(mockWalletClient, {
      address: validParameters.address,
      controller: validParameters.controller,
      owner: validParameters.address,
    });
    expect(erc7540RequestRedeem).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' when the request is blocked, also with a claimable deposit", async function () {
    mockMaxRequestRedeem({ ownerMax: BigInt(0), vaultMax: BigInt(0) });
    vi.mocked(getMaxMint).mockResolvedValue(validParameters.shares);

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onFailedValidation = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Shares exceed the max redeem request",
    );
    expect(erc7540RequestRedeem).not.toHaveBeenCalled();
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
      mockRead() {
        vi.mocked(readContract).mockResolvedValueOnce(false);
        vi.mocked(allowance).mockRejectedValueOnce(rpcError);
      },
      name: "allowance",
    },
    {
      mockRead: () =>
        vi.mocked(getMaxRequestRedeem).mockRejectedValueOnce(rpcError),
      name: "getMaxRequestRedeem",
    },
  ])(
    "should emit 'unexpected-error' when the $name read fails",
    async function ({ mockRead }) {
      mockRead();

      const { emitter, promise } = requestRedeem(mockWalletClient, {
        ...validParameters,
        owner: otherOwner,
      });

      const onUnexpectedError = vi.fn();
      const onSettled = vi.fn();

      emitter.on("unexpected-error", onUnexpectedError);
      emitter.on("request-redeem-settled", onSettled);

      await promise;

      expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(rpcError);
      expect(erc7540RequestRedeem).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should not read the operator status or the allowance when the account is the owner", async function () {
    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = requestRedeem(mockWalletClient, validParameters);

    await promise;

    expect(readContract).not.toHaveBeenCalled();
    expect(allowance).not.toHaveBeenCalled();
  });

  it("should request for an owner when the account is its operator", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(true);
    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      owner: otherOwner,
    });

    await promise;

    expect(readContract).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [otherOwner, mockWalletClient.account!.address],
      functionName: "isOperator",
    });
    expect(allowance).not.toHaveBeenCalled();
    expect(getMaxMint).not.toHaveBeenCalled();
    expect(erc7540RequestRedeem).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      { ...validParameters, owner: otherOwner },
    );
  });

  it("should request for an owner when the account allowance covers the shares", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(false);
    vi.mocked(allowance).mockResolvedValueOnce(validParameters.shares);
    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      owner: otherOwner,
    });

    await promise;

    expect(allowance).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
      owner: otherOwner,
      spender: mockWalletClient.account!.address,
    });
    expect(erc7540RequestRedeem).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed-validation' if the account is not the owner or its operator, and its allowance is lower than shares", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(false);
    vi.mocked(allowance).mockResolvedValueOnce(
      validParameters.shares - BigInt(1),
    );

    const { emitter, promise } = requestRedeem(mockWalletClient, {
      ...validParameters,
      owner: otherOwner,
    });

    const onFailedValidation = vi.fn();

    emitter.on("request-redeem-failed-validation", onFailedValidation);

    await promise;

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Account is not the owner or its operator, and its allowance is lower than shares",
    );
    expect(erc7540RequestRedeem).not.toHaveBeenCalled();
  });

  it("should emit success events when request redeem succeeds", async function () {
    const receipt = {
      status: "success",
    } as TransactionReceipt;

    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
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
    expect(erc7540RequestRedeem).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      validParameters,
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'user-signing-request-redeem-error' when signing fails", async function () {
    vi.mocked(erc7540RequestRedeem).mockRejectedValue(
      new Error("Signing error"),
    );

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onSigningError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("user-signing-request-redeem-error", onSigningError);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-failed' when waiting for the receipt fails", async function () {
    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error("Receipt error"),
    );

    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      validParameters,
    );

    const onFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("request-redeem-failed", onFailed);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'request-redeem-transaction-reverted' when transaction reverts", async function () {
    const receipt = {
      status: "reverted",
    } as TransactionReceipt;

    vi.mocked(erc7540RequestRedeem).mockResolvedValue(zeroHash);
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

  it("should emit 'unexpected-error' and settle when params is not defined", async function () {
    const { emitter, promise } = requestRedeem(
      mockWalletClient,
      // @ts-expect-error testing a missing params object
      undefined,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("request-redeem-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(TypeError),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});

describe("encodeRequestRedeem", function () {
  it("should encode the requestRedeem call", function () {
    const { controller, owner, shares } = validParameters;

    const { args, functionName } = decodeFunctionData({
      abi: erc7540Abi,
      data: encodeRequestRedeem({ controller, owner, shares }),
    });

    expect(functionName).toBe("requestRedeem");
    expect(args).toEqual([shares, controller, owner]);
  });
});
