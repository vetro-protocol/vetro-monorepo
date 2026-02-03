import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getCooldownEnabled } from "../../src/actions/public/getCooldownEnabled";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getCooldownEnabled", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getCooldownEnabled(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getCooldownEnabled(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getCooldownEnabled(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      address: zeroAddress,
    };

    await expect(getCooldownEnabled(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const cooldownEnabled = true;

    vi.mocked(readContract).mockResolvedValueOnce(cooldownEnabled);

    const result = await getCooldownEnabled(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      functionName: "cooldownEnabled",
    });
    expect(result).toBe(cooldownEnabled);
  });
});
