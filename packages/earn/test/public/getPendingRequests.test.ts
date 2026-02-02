import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getPendingRequests } from "../../src/actions/public/getPendingRequests";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  account: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getPendingRequests", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getPendingRequests(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getPendingRequests(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getPendingRequests(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getPendingRequests(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the account is not valid", async function () {
    const parameters = {
      ...validParameters,
      account: "invalid_account",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getPendingRequests(client, parameters)).rejects.toThrow(
      "Account address is invalid",
    );
  });

  it("should throw an error if the account is zero address", async function () {
    const parameters = {
      ...validParameters,
      account: zeroAddress,
    };

    await expect(getPendingRequests(client, parameters)).rejects.toThrow(
      "Account address is invalid",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const pendingRequests = [
      [BigInt(1), BigInt(2)],
      [BigInt(1000), BigInt(2000)],
      [BigInt(1700000000), BigInt(1700100000)],
    ];

    vi.mocked(readContract).mockResolvedValueOnce(pendingRequests);

    const result = await getPendingRequests(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.account],
      functionName: "getPendingRequests",
    });
    expect(result).toEqual(pendingRequests);
  });
});
