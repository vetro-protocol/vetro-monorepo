import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { quoteRedeem } from "../../src/actions/public/quoteRedeem.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

const validParameters = {
  address: "0x000000000000000000000000000000000000bEEF" as Address,
  asset: "0x000000000000000000000000000000000000dEaD" as Address,
  callbackFee: 7n,
  isInstant: false,
  shares: 100n,
};

describe("quoteRedeem", function () {
  it("forwards args and returns the native fee", async function () {
    vi.mocked(readContract).mockResolvedValue(42n);

    const result = await quoteRedeem(client, validParameters);

    expect(result).toBe(42n);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: validParameters.address,
        args: [validParameters.asset, 100n, 7n, false],
        functionName: "quoteRedeem",
      }),
    );
  });

  it("forwards isInstant=true when the caller declares the instant path", async function () {
    vi.mocked(readContract).mockResolvedValue(42n);

    await quoteRedeem(client, { ...validParameters, isInstant: true });

    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        args: [validParameters.asset, 100n, 7n, true],
      }),
    );
  });

  it("rejects the zero address as asset", async function () {
    await expect(
      quoteRedeem(client, { ...validParameters, asset: zeroAddress }),
    ).rejects.toThrow("Asset address is invalid");
  });

  it("rejects non-positive shares", async function () {
    await expect(
      quoteRedeem(client, { ...validParameters, shares: 0n }),
    ).rejects.toThrow("Shares must be greater than zero");
  });

  it("rejects negative callbackFee", async function () {
    await expect(
      quoteRedeem(client, { ...validParameters, callbackFee: -1n }),
    ).rejects.toThrow("Callback fee cannot be negative");
  });
});
