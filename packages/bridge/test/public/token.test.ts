import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { token } from "../../src/actions/public/token";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  oftAddress: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("token", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      token(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(token(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if oftAddress is invalid", async function () {
    const parameters = { oftAddress: "not_an_address" };
    // @ts-expect-error - Testing invalid input
    await expect(token(client, parameters)).rejects.toThrow(
      "OFT address is invalid",
    );
  });

  it("should throw an error if oftAddress is zero address", async function () {
    await expect(token(client, { oftAddress: zeroAddress })).rejects.toThrow(
      "OFT address is invalid",
    );
  });

  it("should call readContract and return the underlying token address", async function () {
    const tokenAddress =
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address;
    vi.mocked(readContract).mockResolvedValueOnce(tokenAddress);

    const result = await token(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.oftAddress,
      functionName: "token",
    });
    expect(result).toBe(tokenAddress);
  });
});
