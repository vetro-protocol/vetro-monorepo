import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { previewRedeem } from "../../src/actions/public/previewRedeem";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  peggedTokenIn: BigInt(1000),
  tokenOut: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("previewRedeem", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      previewRedeem(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      peggedTokenIn: validParameters.peggedTokenIn,
      tokenOut: validParameters.tokenOut,
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Gateway address cannot be zero address",
    );
  });

  it("should throw an error if the token address is not valid", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: "invalid_token",
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
      peggedTokenIn: validParameters.peggedTokenIn,
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is zero address", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: zeroAddress,
    };

    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Token address cannot be zero address",
    );
  });

  it("should throw an error if peggedTokenIn is not a bigint", async function () {
    const parameters = { ...validParameters, peggedTokenIn: 1000 };

    // @ts-expect-error - Testing invalid input
    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Amount must be a bigint",
    );
  });

  it("should throw an error if peggedTokenIn is zero", async function () {
    const parameters = { ...validParameters, peggedTokenIn: BigInt(0) };

    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if peggedTokenIn is negative", async function () {
    const parameters = { ...validParameters, peggedTokenIn: BigInt(-1) };

    await expect(previewRedeem(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const amountOut = BigInt(950);

    vi.mocked(readContract).mockResolvedValueOnce(amountOut);

    const result = await previewRedeem(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.tokenOut, validParameters.peggedTokenIn],
      functionName: "previewRedeem",
    });
    expect(result).toBe(amountOut);
  });
});
