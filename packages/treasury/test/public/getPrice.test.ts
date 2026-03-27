import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getPrice } from "../../src/actions/public/getPrice";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  token: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getPrice", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getPrice(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getPrice(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getPrice(client, parameters)).rejects.toThrow(
      "Treasury address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getPrice(client, parameters)).rejects.toThrow(
      "Treasury address is invalid",
    );
  });

  it("should throw an error if the token is not valid", async function () {
    const parameters = {
      ...validParameters,
      token: "invalid_token",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getPrice(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if the token is zero address", async function () {
    const parameters = {
      ...validParameters,
      token: zeroAddress,
    };

    await expect(getPrice(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    vi.mocked(readContract);

    await getPrice(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.token],
      functionName: "getPrice",
    });
  });
});
