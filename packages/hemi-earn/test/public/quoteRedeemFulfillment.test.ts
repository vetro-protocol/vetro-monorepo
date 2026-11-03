import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { quoteRedeemFulfillment } from "../../src/actions/public/quoteRedeemFulfillment.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};
const address = "0x000000000000000000000000000000000000bEEF" as Address;
const remoteAsset = "0x000000000000000000000000000000000000dEaD" as Address;

describe("quoteRedeemFulfillment", function () {
  it("forwards args and returns the native fee", async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(99));

    const result = await quoteRedeemFulfillment(client, {
      address,
      remoteAsset,
    });

    expect(result).toBe(BigInt(99));
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [remoteAsset],
        functionName: "quoteRedeemFulfillment",
      }),
    );
  });

  it("rejects the zero address as remoteAsset", async function () {
    await expect(
      quoteRedeemFulfillment(client, { address, remoteAsset: zeroAddress }),
    ).rejects.toThrow("Remote asset address is invalid");
  });

  it("rejects the zero address as agent address", async function () {
    await expect(
      quoteRedeemFulfillment(client, { address: zeroAddress, remoteAsset }),
    ).rejects.toThrow("Agent address is invalid");
  });

  it("rejects an invalid agent address", async function () {
    await expect(
      quoteRedeemFulfillment(client, {
        address: "0xnotanaddress" as Address,
        remoteAsset,
      }),
    ).rejects.toThrow("Agent address is invalid");
  });
});
