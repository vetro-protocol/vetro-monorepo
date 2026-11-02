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
const asset = "0x000000000000000000000000000000000000dEaD" as Address;

describe("quoteRedeemFulfillment", function () {
  it("forwards args and returns the native fee", async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(99));

    const result = await quoteRedeemFulfillment(client, { address, asset });

    expect(result).toBe(BigInt(99));
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [asset],
        functionName: "quoteRedeemFulfillment",
      }),
    );
  });

  it("rejects the zero address as asset", async function () {
    await expect(
      quoteRedeemFulfillment(client, { address, asset: zeroAddress }),
    ).rejects.toThrow("Asset address is invalid");
  });

  it("rejects the zero address as agent address", async function () {
    await expect(
      quoteRedeemFulfillment(client, { address: zeroAddress, asset }),
    ).rejects.toThrow("Agent address is invalid");
  });

  it("rejects an invalid agent address", async function () {
    await expect(
      quoteRedeemFulfillment(client, {
        address: "0xnotanaddress" as Address,
        asset,
      }),
    ).rejects.toThrow("Agent address is invalid");
  });
});
