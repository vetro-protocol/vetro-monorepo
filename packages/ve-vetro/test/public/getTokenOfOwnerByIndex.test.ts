import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getTokenOfOwnerByIndex } from "../../src/actions/public/getTokenOfOwnerByIndex.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  index: 1n,
  owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getTokenOfOwnerByIndex", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getTokenOfOwnerByIndex(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getTokenOfOwnerByIndex(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getTokenOfOwnerByIndex(client, parameters)).rejects.toThrow(
      "ve-vetro address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getTokenOfOwnerByIndex(client, parameters)).rejects.toThrow(
      "ve-vetro address is invalid",
    );
  });

  it("should throw an error if the block number is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      blockNumber: 1,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getTokenOfOwnerByIndex(client, parameters)).rejects.toThrow(
      "Block number must be a bigint",
    );
  });

  it("should throw an error if the index is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      index: 1,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getTokenOfOwnerByIndex(client, parameters)).rejects.toThrow(
      "Index must be a bigint",
    );
  });

  it("should throw an error if the owner is not valid", async function () {
    const parameters = {
      ...validParameters,
      owner: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getTokenOfOwnerByIndex(client, parameters)).rejects.toThrow(
      "Owner address is invalid",
    );
  });

  it("should throw an error if the owner is zero address", async function () {
    const parameters = {
      ...validParameters,
      owner: zeroAddress,
    };

    await expect(getTokenOfOwnerByIndex(client, parameters)).rejects.toThrow(
      "Owner address is invalid",
    );
  });

  it("should return the token id at the latest block", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(42n);

    const tokenId = await getTokenOfOwnerByIndex(client, validParameters);

    expect(tokenId).toBe(42n);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.owner, validParameters.index],
      blockNumber: undefined,
      functionName: "tokenOfOwnerByIndex",
    });
  });

  it("should return the token id at the given block", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(7n);

    const tokenId = await getTokenOfOwnerByIndex(client, {
      ...validParameters,
      blockNumber: 100n,
    });

    expect(tokenId).toBe(7n);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.owner, validParameters.index],
      blockNumber: 100n,
      functionName: "tokenOfOwnerByIndex",
    });
  });
});
