import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getConfig } from "../../src/actions/public/getConfig.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getConfig", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getConfig(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getConfig(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(getConfig(client, parameters)).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    await expect(getConfig(client, { address: zeroAddress })).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should return the distributor config", async function () {
    const config = {
      claimEnd: 1_800_000_000n,
      expectedTotalAtSnapshot: 1_000n,
      forfeitableBps: 1_000,
      lockedBps: 4_000,
      mintNonTransferable: true,
      regularBps: 5_000,
      requireTermsSignature: true,
      shortfallAllowance: 10n,
      snapshotTimestamp: 1_700_000_000n,
      splitByType: false,
      termsHash:
        "0x1234567890123456789012345678901234567890123456789012345678901234",
      totalAllocation: 1_000_000n,
      unlockTimestamp: 1_900_000_000n,
    } as const;
    vi.mocked(readContract).mockResolvedValueOnce(config);

    const result = await getConfig(client, validParameters);

    expect(result).toEqual(config);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      functionName: "config",
    });
  });
});
