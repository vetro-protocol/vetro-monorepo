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
  assets: BigInt(100),
  callbackFee: BigInt(7),
};

describe("quoteDeposit", function () {
  it("forwards args and returns the native fee", async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(42));

    const result = await quoteDeposit(client, validParameters);

    expect(result).toBe(BigInt(42));
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: validParameters.address,
        args: [validParameters.asset, BigInt(100), BigInt(7)],
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
      quoteDeposit(client, { ...validParameters, assets: BigInt(0) }),
    ).rejects.toThrow("Assets must be greater than zero");
  });

  it("rejects negative callbackFee", async function () {
    await expect(
      quoteDeposit(client, { ...validParameters, callbackFee: BigInt(-1) }),
    ).rejects.toThrow("Callback fee cannot be negative");
  });
});
