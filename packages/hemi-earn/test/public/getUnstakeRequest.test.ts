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
  amountOutMin: BigInt(10),
  asset: someAddress,
  claimableAt: BigInt(1_700_000_000),
  nativeFee: BigInt(5),
  operator: someAddress,
  share: someAddress,
  shares: BigInt(50),
  unstakingRequestId: BigInt(3),
};

describe("getUnstakeRequest", function () {
  it("returns the on-chain unstake struct", async function () {
    vi.mocked(readContract).mockResolvedValue(unstakeRequest);

    const result = await getUnstakeRequest(client, {
      address,
      requestId: BigInt(1),
    });

    expect(result).toEqual(unstakeRequest);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [BigInt(1)],
        functionName: "unstakeRequests",
      }),
    );
  });

  it("rejects a non-positive requestId", async function () {
    await expect(
      getUnstakeRequest(client, { address, requestId: BigInt(0) }),
    ).rejects.toThrow("Request ID must be greater than zero");
  });

  it("rejects a zero agent address", async function () {
    await expect(
      getUnstakeRequest(client, {
        address: zeroAddress,
        requestId: BigInt(1),
      }),
    ).rejects.toThrow("Agent address is invalid");
  });
});
