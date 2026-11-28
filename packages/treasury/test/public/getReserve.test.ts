import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getReserve } from "../../src/actions/public/getReserve.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getReserve", function () {
  beforeEach(function () {
    vi.clearAllMocks();
  });

  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getReserve(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
    expect(readContract).not.toHaveBeenCalled();
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getReserve(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
    expect(readContract).not.toHaveBeenCalled();
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getReserve(client, parameters)).rejects.toThrow(
      "Treasury address is invalid",
    );
    expect(readContract).not.toHaveBeenCalled();
  });

  it("should throw an error if the address is not provided", async function () {
    const parameters = {};
    // @ts-expect-error - Testing invalid input
    await expect(getReserve(client, parameters)).rejects.toThrow(
      "Treasury address is invalid",
    );
    expect(readContract).not.toHaveBeenCalled();
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      address: zeroAddress,
    };

    await expect(getReserve(client, parameters)).rejects.toThrow(
      "Treasury address is invalid",
    );
    expect(readContract).not.toHaveBeenCalled();
  });

  it("should call readContract with the reserve function and no args", async function () {
    await getReserve(client, validParameters);

    expect(readContract).toHaveBeenCalledExactlyOnceWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      functionName: "reserve",
    });
  });

  it("should return the reserve read from the treasury", async function () {
    const reserve = 123n * 10n ** 18n;
    vi.mocked(readContract).mockResolvedValueOnce(reserve);

    const result = await getReserve(client, validParameters);

    expect(result).toBe(reserve);
  });
});
