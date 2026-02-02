import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getRequestDetails } from "../../src/actions/public/getRequestDetails";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  requestId: BigInt(1),
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getRequestDetails", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getRequestDetails(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getRequestDetails(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getRequestDetails(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getRequestDetails(client, parameters)).rejects.toThrow(
      "StakingVault address is invalid",
    );
  });

  it("should throw an error if the requestId is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      requestId: 1,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getRequestDetails(client, parameters)).rejects.toThrow(
      "Request ID must be a bigint",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const requestDetails = {
      assets: BigInt(1000),
      claimableAt: BigInt(1700000000),
      owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
    };

    vi.mocked(readContract).mockResolvedValueOnce(requestDetails);

    const result = await getRequestDetails(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.requestId],
      functionName: "getRequestDetails",
    });
    expect(result).toEqual(requestDetails);
  });
});
