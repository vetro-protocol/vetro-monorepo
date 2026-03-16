import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { getMaxWithdraw } from "../../src/actions/public/getMaxWithdraw";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  tokenOut: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getMaxWithdraw", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getMaxWithdraw(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getMaxWithdraw(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };

    // @ts-expect-error - Testing invalid input
    await expect(getMaxWithdraw(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      tokenOut: validParameters.tokenOut,
    };

    // @ts-expect-error - Testing invalid input
    await expect(getMaxWithdraw(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getMaxWithdraw(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the token address is not valid", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: "invalid_token",
    };

    // @ts-expect-error - Testing invalid input
    await expect(getMaxWithdraw(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if the token address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
    };

    // @ts-expect-error - Testing invalid input
    await expect(getMaxWithdraw(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if the token address is zero address", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: zeroAddress,
    };

    await expect(getMaxWithdraw(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    vi.mocked(readContract);

    await getMaxWithdraw(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.tokenOut],
      functionName: "maxWithdraw",
    });
  });
});
