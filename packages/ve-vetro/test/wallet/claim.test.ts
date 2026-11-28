import {
  type Address,
  decodeFunctionData,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { hemiSepolia } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { veVetroDistributorAbi } from "../../src/abi/veVetroDistributorAbi.ts";
import { getConfig } from "../../src/actions/public/getConfig.ts";
import { isClaimOpen } from "../../src/actions/public/isClaimOpen.ts";
import { verifyTermsSignature } from "../../src/actions/public/verifyTermsSignature.ts";
import { claim, encodeClaim } from "../../src/actions/wallet/claim.ts";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}));

vi.mock("../../src/actions/public/getConfig.ts", () => ({
  getConfig: vi.fn(),
}));

vi.mock("../../src/actions/public/isClaimOpen.ts", () => ({
  isClaimOpen: vi.fn(),
}));

vi.mock("../../src/actions/public/verifyTermsSignature.ts", () => ({
  verifyTermsSignature: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: hemiSepolia,
} as unknown as WalletClient;

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  recipient: "0x2222222222222222222222222222222222222222" as Address,
  signature: "0xabcdef" as const,
  tokenIds: [BigInt(1), BigInt(2)],
};

const successReceipt = { status: "success" } as TransactionReceipt;

const mockConfig = function (requireTermsSignature: boolean) {
  vi.mocked(getConfig).mockResolvedValue({
    requireTermsSignature,
  } as Awaited<ReturnType<typeof getConfig>>);
};

describe("claim", function () {
  beforeEach(function () {
    vi.mocked(isClaimOpen).mockResolvedValue(true);
    mockConfig(true);
    vi.mocked(verifyTermsSignature).mockResolvedValue(true);
  });

  it.each([
    {
      client: undefined,
      name: "client is not defined",
      reason: "Client is not defined",
    },
    {
      client: { account: mockWalletClient.account },
      name: "client chain is not defined",
      reason: "Chain is not defined on wallet client",
    },
    {
      client: { chain: hemiSepolia },
      name: "client.account is not defined",
      reason: "Client must have an account",
    },
  ])(
    "should emit 'claim-failed-validation' if $name",
    async function ({ client, reason }) {
      const { emitter, promise } = claim(
        client as unknown as WalletClient,
        validParameters,
      );

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("claim-failed-validation", onFailedValidation);
      emitter.on("claim-settled", onSettled);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it.each([
    {
      name: "distributor address is invalid",
      parameters: { address: zeroAddress },
      reason: "Invalid distributor address",
    },
    {
      name: "recipient address is invalid",
      parameters: { recipient: zeroAddress },
      reason: "Invalid recipient address",
    },
    {
      name: "signature is not hex",
      parameters: { signature: "abc" },
      reason: "Signature must be hex",
    },
    {
      name: "token ids are empty",
      parameters: { tokenIds: [] },
      reason: "Token ids must not be empty",
    },
    {
      name: "a token id is not a bigint",
      parameters: { tokenIds: [1] },
      reason: "Token ids must be bigints",
    },
    {
      name: "a token id repeats",
      parameters: { tokenIds: [BigInt(1), BigInt(1)] },
      reason: "Token ids must not repeat",
    },
  ])(
    "should emit 'claim-failed-validation' if $name",
    async function ({ parameters, reason }) {
      const { emitter, promise } = claim(mockWalletClient, {
        ...validParameters,
        ...(parameters as Partial<typeof validParameters>),
      });

      const onFailedValidation = vi.fn();
      const onSettled = vi.fn();

      emitter.on("claim-failed-validation", onFailedValidation);
      emitter.on("claim-settled", onSettled);

      await promise;

      expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(reason);
      expect(isClaimOpen).not.toHaveBeenCalled();
      expect(getConfig).not.toHaveBeenCalled();
      expect(writeContract).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should emit 'claim-failed-validation' if claims are not open", async function () {
    vi.mocked(isClaimOpen).mockResolvedValue(false);

    const { emitter, promise } = claim(mockWalletClient, validParameters);

    const onFailedValidation = vi.fn();

    emitter.on("claim-failed-validation", onFailedValidation);

    await promise;

    expect(isClaimOpen).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
    });
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Claims are not open",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it.each([
    {
      mockRead: (error: Error) =>
        vi.mocked(isClaimOpen).mockRejectedValue(error),
      name: "isClaimOpen",
    },
    {
      mockRead: (error: Error) => vi.mocked(getConfig).mockRejectedValue(error),
      name: "getConfig",
    },
    {
      mockRead: (error: Error) =>
        vi.mocked(verifyTermsSignature).mockRejectedValue(error),
      name: "verifyTermsSignature",
    },
  ])(
    "should emit 'unexpected-error' when the $name read fails",
    async function ({ mockRead }) {
      const rpcError = new Error("RPC error");
      mockRead(rpcError);

      const { emitter, promise } = claim(mockWalletClient, validParameters);

      const onUnexpectedError = vi.fn();
      const onSettled = vi.fn();

      emitter.on("unexpected-error", onUnexpectedError);
      emitter.on("claim-settled", onSettled);

      await promise;

      expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(rpcError);
      expect(writeContract).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledOnce();
    },
  );

  it("should emit 'claim-failed-validation' if the terms signature is not valid", async function () {
    vi.mocked(verifyTermsSignature).mockResolvedValue(false);

    const { emitter, promise } = claim(mockWalletClient, validParameters);

    const onFailedValidation = vi.fn();

    emitter.on("claim-failed-validation", onFailedValidation);

    await promise;

    expect(getConfig).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      address: validParameters.address,
    });
    expect(verifyTermsSignature).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      {
        address: validParameters.address,
        claimant: mockWalletClient.account!.address,
        recipient: validParameters.recipient,
        signature: validParameters.signature,
      },
    );
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid terms signature",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("should verify empty bytes when the signature is required but missing", async function () {
    vi.mocked(verifyTermsSignature).mockResolvedValue(false);

    const { emitter, promise } = claim(mockWalletClient, {
      address: validParameters.address,
      recipient: validParameters.recipient,
      tokenIds: validParameters.tokenIds,
    });

    const onFailedValidation = vi.fn();

    emitter.on("claim-failed-validation", onFailedValidation);

    await promise;

    expect(verifyTermsSignature).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({ signature: "0x" }),
    );
    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      "Invalid terms signature",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("should not verify the signature when the config does not require it", async function () {
    mockConfig(false);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = claim(mockWalletClient, {
      address: validParameters.address,
      recipient: validParameters.recipient,
      tokenIds: validParameters.tokenIds,
    });

    await promise;

    expect(verifyTermsSignature).not.toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalledOnce();
  });

  it("should emit success events when the claim succeeds", async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { emitter, promise } = claim(mockWalletClient, validParameters);

    const onPreClaim = vi.fn();
    const onUserSignedClaim = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("pre-claim", onPreClaim);
    emitter.on("user-signed-claim", onUserSignedClaim);
    emitter.on("claim-transaction-succeeded", onTransactionSucceeded);
    emitter.on("claim-settled", onSettled);

    await promise;

    expect(onPreClaim).toHaveBeenCalledOnce();
    expect(onUserSignedClaim).toHaveBeenCalledExactlyOnceWith(zeroHash);
    expect(onTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      successReceipt,
    );
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
      abi: veVetroDistributorAbi,
      account: mockWalletClient.account,
      address: validParameters.address,
      args: [
        validParameters.tokenIds,
        validParameters.recipient,
        validParameters.signature,
      ],
      chain: mockWalletClient.chain,
      functionName: "claim",
    });
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should send empty bytes when there is no signature", async function () {
    mockConfig(false);
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(successReceipt);

    const { promise } = claim(mockWalletClient, {
      address: validParameters.address,
      recipient: validParameters.recipient,
      tokenIds: validParameters.tokenIds,
    });

    await promise;

    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({
        args: [validParameters.tokenIds, validParameters.recipient, "0x"],
      }),
    );
  });

  it("should emit 'user-signing-claim-error' when signing fails", async function () {
    const signingError = new Error("Signing error");
    vi.mocked(writeContract).mockRejectedValue(signingError);

    const { emitter, promise } = claim(mockWalletClient, validParameters);

    const onSigningError = vi.fn();
    const onUserSignedClaim = vi.fn();
    const onSettled = vi.fn();

    emitter.on("user-signing-claim-error", onSigningError);
    emitter.on("user-signed-claim", onUserSignedClaim);
    emitter.on("claim-settled", onSettled);

    await promise;

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(signingError);
    expect(onUserSignedClaim).not.toHaveBeenCalled();
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-failed' when waiting for the receipt fails", async function () {
    const receiptError = new Error("Receipt error");
    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(receiptError);

    const { emitter, promise } = claim(mockWalletClient, validParameters);

    const onFailed = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-failed", onFailed);
    emitter.on("claim-settled", onSettled);

    await promise;

    expect(onFailed).toHaveBeenCalledExactlyOnceWith(receiptError);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'claim-transaction-reverted' when the transaction reverts", async function () {
    const receipt = { status: "reverted" } as TransactionReceipt;

    vi.mocked(writeContract).mockResolvedValue(zeroHash);
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt);

    const { emitter, promise } = claim(mockWalletClient, validParameters);

    const onTransactionReverted = vi.fn();
    const onTransactionSucceeded = vi.fn();
    const onSettled = vi.fn();

    emitter.on("claim-transaction-reverted", onTransactionReverted);
    emitter.on("claim-transaction-succeeded", onTransactionSucceeded);
    emitter.on("claim-settled", onSettled);

    await promise;

    expect(onTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt);
    expect(onTransactionSucceeded).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("should emit 'unexpected-error' and settle when params is not defined", async function () {
    const { emitter, promise } = claim(
      mockWalletClient,
      // @ts-expect-error testing a missing params object
      undefined,
    );

    const onUnexpectedError = vi.fn();
    const onSettled = vi.fn();

    emitter.on("unexpected-error", onUnexpectedError);
    emitter.on("claim-settled", onSettled);

    await promise;

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(
      expect.any(TypeError),
    );
    expect(onSettled).toHaveBeenCalledOnce();
  });
});

describe("encodeClaim", function () {
  it("defaults the signature to empty bytes", function () {
    const { args, functionName } = decodeFunctionData({
      abi: veVetroDistributorAbi,
      data: encodeClaim({
        address: validParameters.address,
        recipient: validParameters.recipient,
        tokenIds: validParameters.tokenIds,
      }),
    });

    expect(functionName).toBe("claim");
    expect(args).toEqual([
      validParameters.tokenIds,
      validParameters.recipient,
      "0x",
    ]);
  });
});
