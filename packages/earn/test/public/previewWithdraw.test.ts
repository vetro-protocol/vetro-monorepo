import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { previewWithdraw } from "../../src/actions/public/previewWithdraw";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  assets: BigInt(1000),
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

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if assets is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      assets: 1000,
    };
    // @ts-expect-error - Testing invalid input
    await expect(previewWithdraw(client, parameters)).rejects.toThrow(
      "Assets must be a bigint",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const shares = BigInt(950);

    vi.mocked(readContract).mockResolvedValueOnce(shares);

    const result = await previewWithdraw(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.assets],
      functionName: "previewWithdraw",
    });
    expect(result).toBe(shares);
  });
});
