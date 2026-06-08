import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { previewWithdraw } from "../../src/actions/public/previewWithdraw";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  amountOut: BigInt(1000),
  tokenOut: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("previewWithdraw", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      previewWithdraw(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      amountOut: validParameters.amountOut,
      tokenOut: validParameters.tokenOut,
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the token address is not valid", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: "invalid_token",
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if the token address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
      amountOut: validParameters.amountOut,
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if the token address is zero address", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: zeroAddress,
    };

    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if amountOut is not a bigint", async function () {
    const parameters = { ...validParameters, amountOut: 1000 };

    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Amount must be a bigint",
    );
  });

  it("should throw an error if amountOut is zero", async function () {
    const parameters = { ...validParameters, amountOut: BigInt(0) };

    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if amountOut is negative", async function () {
    const parameters = { ...validParameters, amountOut: BigInt(-1) };

    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const peggedTokenIn = BigInt(1050);

    vi.mocked(readContract).mockResolvedValueOnce(peggedTokenIn);

    const result = await previewWithdraw(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.tokenOut, validParameters.amountOut],
      functionName: "previewWithdraw",
    });
    expect(result).toBe(peggedTokenIn);
  });
});
