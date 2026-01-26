import { Address, Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, it, expect, vi } from "vitest";

import { isInstantRedeemWhitelisted } from "../../src/actions/public/isInstantRedeemWhitelisted";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  account: "0x0987654321098765432109876543210987654321" as Address,
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("isInstantRedeemWhitelisted", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      isInstantRedeemWhitelisted(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(isInstantRedeemWhitelisted(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(
      isInstantRedeemWhitelisted(client, parameters),
    ).rejects.toThrow("Invalid gateway address");
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      account: validParameters.account,
    };
    // @ts-expect-error - Testing invalid input
    await expect(
      isInstantRedeemWhitelisted(client, parameters),
    ).rejects.toThrow("Invalid gateway address");
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(
      isInstantRedeemWhitelisted(client, parameters),
    ).rejects.toThrow("Gateway address cannot be zero address");
  });

  it("should throw an error if the account address is not valid", async function () {
    const parameters = {
      ...validParameters,
      account: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(
      isInstantRedeemWhitelisted(client, parameters),
    ).rejects.toThrow("Invalid account address");
  });

  it("should throw an error if the account address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
    };
    // @ts-expect-error - Testing invalid input
    await expect(
      isInstantRedeemWhitelisted(client, parameters),
    ).rejects.toThrow("Invalid account address");
  });

  it("should throw an error if the account address is zero address", async function () {
    const parameters = {
      ...validParameters,
      account: zeroAddress,
    };

    await expect(
      isInstantRedeemWhitelisted(client, parameters),
    ).rejects.toThrow("Account address cannot be zero address");
  });

  it("should call readContract if parameters are valid", async function () {
    vi.mocked(readContract);

    await isInstantRedeemWhitelisted(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.account],
      functionName: "isInstantRedeemWhitelisted",
    });
  });
});
