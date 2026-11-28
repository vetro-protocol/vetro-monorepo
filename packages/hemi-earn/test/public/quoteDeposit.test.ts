import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { quoteDeposit } from "../../src/actions/public/quoteDeposit.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

const validParameters = {
  address: "0x000000000000000000000000000000000000bEEF" as Address,
  asset: "0x000000000000000000000000000000000000dEaD" as Address,
  assets: 100n,
  callbackFee: 7n,
};

describe("quoteDeposit", function () {
  it("forwards args and returns the native fee", async function () {
    vi.mocked(readContract).mockResolvedValue(42n);

    const result = await quoteDeposit(client, validParameters);

    expect(result).toBe(42n);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: validParameters.address,
        args: [validParameters.asset, 100n, 7n],
        functionName: "quoteDeposit",
      }),
    );
  });

  it("rejects the zero address as asset", async function () {
    await expect(
      quoteDeposit(client, { ...validParameters, asset: zeroAddress }),
    ).rejects.toThrow("Asset address is invalid");
  });

  it("rejects non-positive assets", async function () {
    await expect(
      quoteDeposit(client, { ...validParameters, assets: 0n }),
    ).rejects.toThrow("Assets must be greater than zero");
  });

  it("rejects negative callbackFee", async function () {
    await expect(
      quoteDeposit(client, { ...validParameters, callbackFee: -1n }),
    ).rejects.toThrow("Callback fee cannot be negative");
  });
});
