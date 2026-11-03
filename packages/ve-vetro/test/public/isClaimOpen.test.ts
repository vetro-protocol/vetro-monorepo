import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { isClaimOpen } from "../../src/actions/public/isClaimOpen.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("isClaimOpen", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      isClaimOpen(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(isClaimOpen(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(isClaimOpen(client, parameters)).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    await expect(isClaimOpen(client, { address: zeroAddress })).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should return whether the claim is open", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(true);

    const claimOpen = await isClaimOpen(client, validParameters);

    expect(claimOpen).toBe(true);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      functionName: "isClaimOpen",
    });
  });
});
