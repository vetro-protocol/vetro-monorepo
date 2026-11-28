import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getBalanceOf } from "../../src/actions/public/getBalanceOf.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getBalanceOf", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getBalanceOf(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getBalanceOf(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getBalanceOf(client, parameters)).rejects.toThrow(
      "ve-vetro address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getBalanceOf(client, parameters)).rejects.toThrow(
      "ve-vetro address is invalid",
    );
  });

  it("should throw an error if the block number is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      blockNumber: 1,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getBalanceOf(client, parameters)).rejects.toThrow(
      "Block number must be a bigint",
    );
  });

  it("should throw an error if the owner is not valid", async function () {
    const parameters = {
      ...validParameters,
      owner: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getBalanceOf(client, parameters)).rejects.toThrow(
      "Owner address is invalid",
    );
  });

  it("should throw an error if the owner is zero address", async function () {
    const parameters = {
      ...validParameters,
      owner: zeroAddress,
    };

    await expect(getBalanceOf(client, parameters)).rejects.toThrow(
      "Owner address is invalid",
    );
  });

  it("should return the balance at the latest block", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(3n);

    const balance = await getBalanceOf(client, validParameters);

    expect(balance).toBe(3n);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.owner],
      blockNumber: undefined,
      functionName: "balanceOf",
    });
  });

  it("should return the balance at the given block", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(2n);

    const balance = await getBalanceOf(client, {
      ...validParameters,
      blockNumber: 100n,
    });

    expect(balance).toBe(2n);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.owner],
      blockNumber: 100n,
      functionName: "balanceOf",
    });
  });
});
