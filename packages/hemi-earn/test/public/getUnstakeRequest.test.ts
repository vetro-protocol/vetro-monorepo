import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getUnstakeRequest } from "../../src/actions/public/getUnstakeRequest.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};
const address = "0x000000000000000000000000000000000000dEaD" as Address;
const someAddress = "0x000000000000000000000000000000000000bEEF" as Address;

const unstakeRequest = {
  amountOutMin: 10n,
  asset: someAddress,
  claimableAt: 1_700_000_000n,
  nativeFee: 5n,
  operator: someAddress,
  share: someAddress,
  shares: 50n,
  unstakingRequestId: 3n,
};

describe("getUnstakeRequest", function () {
  it("returns the on-chain unstake struct", async function () {
    vi.mocked(readContract).mockResolvedValue(unstakeRequest);

    const result = await getUnstakeRequest(client, {
      address,
      requestId: 1n,
    });

    expect(result).toEqual(unstakeRequest);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [1n],
        functionName: "unstakeRequests",
      }),
    );
  });

  it("rejects a non-positive requestId", async function () {
    await expect(
      getUnstakeRequest(client, { address, requestId: 0n }),
    ).rejects.toThrow("Request ID must be greater than zero");
  });

  it("rejects a zero agent address", async function () {
    await expect(
      getUnstakeRequest(client, {
        address: zeroAddress,
        requestId: 1n,
      }),
    ).rejects.toThrow("Agent address is invalid");
  });
});
