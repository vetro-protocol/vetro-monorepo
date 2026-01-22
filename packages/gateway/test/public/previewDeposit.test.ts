import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { previewDeposit } from "../../src/actions/public/previewDeposit";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  amountIn: BigInt(1000),
  tokenIn: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("previewDeposit", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      previewDeposit(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      amountIn: validParameters.amountIn,
      tokenIn: validParameters.tokenIn,
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Gateway address cannot be zero address",
    );
  });

  it("should throw an error if the token address is not valid", async function () {
    const parameters = {
      ...validParameters,
      tokenIn: "invalid_token",
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
      amountIn: validParameters.amountIn,
    };

    // @ts-expect-error - Testing invalid input
    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is zero address", async function () {
    const parameters = {
      ...validParameters,
      tokenIn: zeroAddress,
    };

    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Token address cannot be zero address",
    );
  });

  it("should throw an error if amountIn is not a bigint", async function () {
    const parameters = { ...validParameters, amountIn: 1000 };

    // @ts-expect-error - Testing invalid input
    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Amount must be a bigint",
    );
  });

  it("should throw an error if amountIn is zero", async function () {
    const parameters = { ...validParameters, amountIn: BigInt(0) };

    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if amountIn is negative", async function () {
    const parameters = { ...validParameters, amountIn: BigInt(-1) };

    await expect(previewDeposit(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const peggedTokenOut = BigInt(950);

    vi.mocked(readContract).mockResolvedValueOnce(peggedTokenOut);

    const result = await previewDeposit(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.tokenIn, validParameters.amountIn],
      functionName: "previewDeposit",
    });
    expect(result).toBe(peggedTokenOut);
  });
});
