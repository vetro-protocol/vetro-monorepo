import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getInstantWithdrawWhitelist } from "../../src/actions/public/getInstantWithdrawWhitelist";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  account: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getInstantWithdrawWhitelist", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getInstantWithdrawWhitelist(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(
      getInstantWithdrawWhitelist(client, undefined),
    ).rejects.toThrow("Parameters are required");
  });

  it("should throw an error if the vault address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(
      getInstantWithdrawWhitelist(client, parameters),
    ).rejects.toThrow("StakingVault address is invalid");
  });

  it("should throw an error if the vault address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(
      getInstantWithdrawWhitelist(client, parameters),
    ).rejects.toThrow("StakingVault address is invalid");
  });

  it("should throw an error if the account address is not valid", async function () {
    const parameters = {
      ...validParameters,
      account: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(
      getInstantWithdrawWhitelist(client, parameters),
    ).rejects.toThrow("Account address is invalid");
  });

  it("should throw an error if the account address is zero address", async function () {
    const parameters = {
      ...validParameters,
      account: zeroAddress,
    };

    await expect(
      getInstantWithdrawWhitelist(client, parameters),
    ).rejects.toThrow("Account address is invalid");
  });

  it("should call readContract if all parameters are valid", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(true);

    const result = await getInstantWithdrawWhitelist(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.account],
      functionName: "instantWithdrawWhitelist",
    });
    expect(result).toBe(true);
  });

  it("should return false for non-whitelisted accounts", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(false);

    const result = await getInstantWithdrawWhitelist(client, validParameters);

    expect(result).toBe(false);
  });
});
