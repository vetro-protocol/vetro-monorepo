import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getEntryGate } from "../../src/actions/public/getEntryGate.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getEntryGate", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getEntryGate(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getEntryGate(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getEntryGate(client, parameters)).rejects.toThrow(
      "Vault address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    await expect(
      getEntryGate(client, { address: zeroAddress }),
    ).rejects.toThrow("Vault address is invalid");
  });

  it("should read the entry gate of the vault", async function () {
    const entryGateAddress = "0x1111111111111111111111111111111111111111";
    vi.mocked(readContract).mockResolvedValueOnce(entryGateAddress);

    const entryGate = await getEntryGate(client, validParameters);

    expect(entryGate).toBe(entryGateAddress);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      functionName: "entryGate",
    });
  });
});
