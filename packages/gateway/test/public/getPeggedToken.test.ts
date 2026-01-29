import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { getPeggedToken } from "../../src/actions/public/getPeggedToken";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getPeggedToken", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getPeggedToken(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getPeggedToken(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getPeggedToken(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the address is not provided", async function () {
    const parameters = {};
    // @ts-expect-error - Testing invalid input
    await expect(getPeggedToken(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      address: zeroAddress,
    };

    await expect(getPeggedToken(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const peggedTokenAddress =
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address;

    vi.mocked(readContract).mockResolvedValueOnce(peggedTokenAddress);

    const result = await getPeggedToken(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      functionName: "PEGGED_TOKEN",
    });
    expect(result).toBe(peggedTokenAddress);
  });
});
