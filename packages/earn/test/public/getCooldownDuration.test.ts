import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getCooldownDuration } from "../../src/actions/public/getCooldownDuration";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getCooldownDuration", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getCooldownDuration(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getCooldownDuration(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getCooldownDuration(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      address: zeroAddress,
    };

    await expect(getCooldownDuration(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const cooldownDuration = BigInt(7 * 24 * 60 * 60); // 7 days in seconds

    vi.mocked(readContract).mockResolvedValueOnce(cooldownDuration);

    const result = await getCooldownDuration(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      functionName: "cooldownDuration",
    });
    expect(result).toBe(cooldownDuration);
  });
});
