import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { getRedeemFee } from "../../src/actions/public/getRedeemFee";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  token: "0xabcdef0123456789abcdef0123456789abcdef01" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getRedeemFee", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getRedeemFee(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getRedeemFee(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };

    // @ts-expect-error - Testing invalid input
    await expect(getRedeemFee(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the address is not provided", async function () {
    const parameters = {};
    // @ts-expect-error - Testing invalid input
    await expect(getRedeemFee(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getRedeemFee(client, parameters)).rejects.toThrow(
      "Gateway is invalid",
    );
  });

  it("should throw an error if the token is not valid", async function () {
    const parameters = {
      ...validParameters,
      token: "invalid_token",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getRedeemFee(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if the token is not provided", async function () {
    const parameters = {
      address: validParameters.address,
    };
    // @ts-expect-error - Testing invalid input
    await expect(getRedeemFee(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should throw an error if the token is zero address", async function () {
    const parameters = {
      ...validParameters,
      token: zeroAddress,
    };

    await expect(getRedeemFee(client, parameters)).rejects.toThrow(
      "Token is invalid",
    );
  });

  it("should call readContract if all parameters are valid", async function () {
    const redeemFee = BigInt(200);

    vi.mocked(readContract).mockResolvedValueOnce(redeemFee);

    const result = await getRedeemFee(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.token],
      functionName: "redeemFee",
    });
    expect(result).toBe(redeemFee);
  });
});
