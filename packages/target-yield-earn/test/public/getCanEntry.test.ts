import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getCanEntry } from "../../src/actions/public/getCanEntry.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  vault: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getCanEntry", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getCanEntry(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getCanEntry(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getCanEntry(client, parameters)).rejects.toThrow(
      "Entry gate address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(getCanEntry(client, parameters)).rejects.toThrow(
      "Entry gate address is invalid",
    );
  });

  it("should throw an error if the owner is not valid", async function () {
    const parameters = {
      ...validParameters,
      owner: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getCanEntry(client, parameters)).rejects.toThrow(
      "Owner address is invalid",
    );
  });

  it("should throw an error if the owner is zero address", async function () {
    const parameters = {
      ...validParameters,
      owner: zeroAddress,
    };

    await expect(getCanEntry(client, parameters)).rejects.toThrow(
      "Owner address is invalid",
    );
  });

  it("should throw an error if the vault is not valid", async function () {
    const parameters = {
      ...validParameters,
      vault: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getCanEntry(client, parameters)).rejects.toThrow(
      "Vault address is invalid",
    );
  });

  it("should throw an error if the vault is zero address", async function () {
    const parameters = {
      ...validParameters,
      vault: zeroAddress,
    };

    await expect(getCanEntry(client, parameters)).rejects.toThrow(
      "Vault address is invalid",
    );
  });

  it("should return the entry gate answer for the vault and the owner", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(false);

    const canEntry = await getCanEntry(client, validParameters);

    expect(canEntry).toBe(false);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.vault, validParameters.owner],
      functionName: "canEntry",
    });
  });
});
