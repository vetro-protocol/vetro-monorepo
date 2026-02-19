import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { getRedeemRequest } from "../../src/actions/public/getRedeemRequest";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  user: "0x0987654321098765432109876543210987654321" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getRedeemRequest", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getRedeemRequest(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getRedeemRequest(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    await expect(
      // @ts-expect-error - Testing invalid input
      getRedeemRequest(client, parameters),
    ).rejects.toThrow("Gateway is invalid");
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      user: validParameters.user,
    };
    await expect(
      // @ts-expect-error - Testing invalid input
      getRedeemRequest(client, parameters),
    ).rejects.toThrow("Gateway is invalid");
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getRedeemRequest(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the user address is not valid", async function () {
    const parameters = {
      ...validParameters,
      user: "invalid_address",
    };
    await expect(
      // @ts-expect-error - Testing invalid input
      getRedeemRequest(client, parameters),
    ).rejects.toThrow("User is invalid");
  });

  it("should throw an error if the user address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
    };
    await expect(
      // @ts-expect-error - Testing invalid input
      getRedeemRequest(client, parameters),
    ).rejects.toThrow("User is invalid");
  });

  it("should throw an error if the user address is zero address", async function () {
    const parameters = {
      ...validParameters,
      user: zeroAddress,
    };

    await expect(getRedeemRequest(client, parameters)).rejects.toThrow(
      "User is invalid",
    );
  });

  it("should call readContract if parameters are valid", async function () {
    vi.mocked(readContract);

    await getRedeemRequest(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.user],
      functionName: "getRedeemRequest",
    });
  });
});
