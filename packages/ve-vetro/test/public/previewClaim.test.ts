import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { previewClaim } from "../../src/actions/public/previewClaim.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  tokenId: 5n,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("previewClaim", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      previewClaim(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(previewClaim(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(previewClaim(client, parameters)).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(previewClaim(client, parameters)).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should throw an error if the token id is not a bigint", async function () {
    const parameters = {
      ...validParameters,
      tokenId: 5,
    };
    // @ts-expect-error - Testing invalid input
    await expect(previewClaim(client, parameters)).rejects.toThrow(
      "Token ID must be a bigint",
    );
  });

  it("should return the claim preview of the token", async function () {
    const ownerOfRecord: Address = "0x2222222222222222222222222222222222222222";
    vi.mocked(readContract).mockResolvedValueOnce([
      ownerOfRecord,
      1_000n,
      1,
      500n,
      true,
    ]);

    const result = await previewClaim(client, validParameters);

    expect(result).toEqual({
      bucket: 1,
      claimed: true,
      ownerOfRecord,
      share: 500n,
      weight: 1_000n,
    });
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.tokenId],
      functionName: "previewClaim",
    });
  });
});
