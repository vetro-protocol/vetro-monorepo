import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getClaimableSubset } from "../../src/actions/public/getClaimableSubset.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  claimant: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  tokenIds: [1n, 2n, 3n],
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getClaimableSubset", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getClaimableSubset(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getClaimableSubset(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getClaimableSubset(client, parameters)).rejects.toThrow(
      "Lens address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getClaimableSubset(client, parameters)).rejects.toThrow(
      "Lens address is invalid",
    );
  });

  it("should throw an error if the claimant is not valid", async function () {
    const parameters = {
      ...validParameters,
      claimant: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getClaimableSubset(client, parameters)).rejects.toThrow(
      "Claimant address is invalid",
    );
  });

  it("should throw an error if the claimant is zero address", async function () {
    const parameters = {
      ...validParameters,
      claimant: zeroAddress,
    };

    await expect(getClaimableSubset(client, parameters)).rejects.toThrow(
      "Claimant address is invalid",
    );
  });

  it("should throw an error if the token ids are not an array", async function () {
    const parameters = {
      ...validParameters,
      tokenIds: 1n,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getClaimableSubset(client, parameters)).rejects.toThrow(
      "Token IDs must be an array of bigints",
    );
  });

  it("should throw an error if a token id is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      tokenIds: [1n, 2],
    };
    // @ts-expect-error - Testing invalid input
    await expect(getClaimableSubset(client, parameters)).rejects.toThrow(
      "Token IDs must be an array of bigints",
    );
  });

  it("should return the claimable ids and their amount", async function () {
    vi.mocked(readContract).mockResolvedValueOnce([[1n, 2n], 100n]);

    const claimable = await getClaimableSubset(client, validParameters);

    expect(claimable).toEqual({ amount: 100n, ids: [1n, 2n] });
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.claimant, validParameters.tokenIds],
      functionName: "claimableSubset",
    });
  });
});
