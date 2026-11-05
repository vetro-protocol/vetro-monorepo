import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getIdsOfRecord } from "../../src/actions/public/getIdsOfRecord.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  fromId: 0n,
  holder: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  toIdExclusive: 100n,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getIdsOfRecord", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getIdsOfRecord(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getIdsOfRecord(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getIdsOfRecord(client, parameters)).rejects.toThrow(
      "Lens address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getIdsOfRecord(client, parameters)).rejects.toThrow(
      "Lens address is invalid",
    );
  });

  it("should throw an error if the holder is not valid", async function () {
    const parameters = {
      ...validParameters,
      holder: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getIdsOfRecord(client, parameters)).rejects.toThrow(
      "Holder address is invalid",
    );
  });

  it("should throw an error if the holder is zero address", async function () {
    const parameters = {
      ...validParameters,
      holder: zeroAddress,
    };

    await expect(getIdsOfRecord(client, parameters)).rejects.toThrow(
      "Holder address is invalid",
    );
  });

  it("should throw an error if the from id is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      fromId: 0,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getIdsOfRecord(client, parameters)).rejects.toThrow(
      "From ID must be a bigint",
    );
  });

  it("should throw an error if the to id is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      toIdExclusive: 100,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getIdsOfRecord(client, parameters)).rejects.toThrow(
      "To ID must be a bigint",
    );
  });

  it("should throw an error if the from id is greater than the to id", async function () {
    const parameters = {
      ...validParameters,
      fromId: 101n,
    };

    await expect(getIdsOfRecord(client, parameters)).rejects.toThrow(
      "From ID must not be greater than to ID",
    );
  });

  it("should return the ids of record and the next id", async function () {
    vi.mocked(readContract).mockResolvedValueOnce([[1n, 18n], 100n]);

    const idsOfRecord = await getIdsOfRecord(client, validParameters);

    expect(idsOfRecord).toEqual({ ids: [1n, 18n], nextId: 100n });
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [
        validParameters.holder,
        validParameters.fromId,
        validParameters.toIdExclusive,
      ],
      functionName: "idsOfRecord",
    });
  });
});
