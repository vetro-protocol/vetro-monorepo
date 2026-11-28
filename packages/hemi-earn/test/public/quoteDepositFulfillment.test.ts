import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { quoteDepositFulfillment } from "../../src/actions/public/quoteDepositFulfillment.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};
const address = "0x000000000000000000000000000000000000bEEF" as Address;
const remoteShare = "0x000000000000000000000000000000000000dEaD" as Address;

describe("quoteDepositFulfillment", function () {
  it("forwards the remoteShare address and returns the native fee", async function () {
    vi.mocked(readContract).mockResolvedValue(42n);

    const result = await quoteDepositFulfillment(client, {
      address,
      remoteShare,
    });

    expect(result).toBe(42n);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [remoteShare],
        functionName: "quoteDepositFulfillment",
      }),
    );
  });

  it("rejects the zero address as remoteShare", async function () {
    await expect(
      quoteDepositFulfillment(client, { address, remoteShare: zeroAddress }),
    ).rejects.toThrow("Remote share address is invalid");
  });

  it("rejects the zero address as agent address", async function () {
    await expect(
      quoteDepositFulfillment(client, { address: zeroAddress, remoteShare }),
    ).rejects.toThrow("Agent address is invalid");
  });

  it("rejects an invalid agent address", async function () {
    await expect(
      quoteDepositFulfillment(client, {
        address: "0xnotanaddress" as Address,
        remoteShare,
      }),
    ).rejects.toThrow("Agent address is invalid");
  });
});
