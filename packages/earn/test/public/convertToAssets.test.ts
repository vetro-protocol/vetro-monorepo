import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { convertToAssets } from "../../src/actions/public/convertToAssets";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  shares: BigInt(1000),
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("convertToAssets", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      convertToAssets(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(convertToAssets(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(convertToAssets(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(convertToAssets(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if shares is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      shares: 1000,
    };
    // @ts-expect-error - Testing invalid input
    await expect(convertToAssets(client, parameters)).rejects.toThrow(
      "Shares must be a bigint",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const assets = BigInt(1050);

    vi.mocked(readContract).mockResolvedValueOnce(assets);

    const result = await convertToAssets(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.shares],
      functionName: "convertToAssets",
    });
    expect(result).toBe(assets);
  });
});
