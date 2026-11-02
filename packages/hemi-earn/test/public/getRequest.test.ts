import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getRequest } from "../../src/actions/public/getRequest.ts";
import { hemiEarnRouterAddress } from "../../src/constants.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};
const address = "0x000000000000000000000000000000000000bEEF" as Address;
const someAddress = "0x000000000000000000000000000000000000dEaD" as Address;

describe("getRequest", function () {
  it("maps the on-chain struct into a typed Request", async function () {
    const request = {
      amountOutMin: BigInt(40),
      asset: someAddress,
      assets: BigInt(100),
      automatic: true,
      kind: 0,
      operator: someAddress,
      receiver: someAddress,
      share: someAddress,
      shares: BigInt(50),
      status: 1,
    };
    vi.mocked(readContract).mockResolvedValue(request);

    const result = await getRequest(client, {
      address,
      requestId: BigInt(1),
    });

    expect(result).toEqual(request);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [BigInt(1)],
        functionName: "requests",
      }),
    );
  });

  it("rejects a non-positive requestId", async function () {
    await expect(
      getRequest(client, { address, requestId: BigInt(0) }),
    ).rejects.toThrow("Request ID must be greater than zero");

    await expect(
      getRequest(client, { address, requestId: BigInt(-1) }),
    ).rejects.toThrow("Request ID must be greater than zero");
  });

  it("preserves narrow kind/status values across the cast", async function () {
    vi.mocked(readContract).mockResolvedValue({
      amountOutMin: BigInt(0),
      asset: someAddress,
      assets: BigInt(0),
      automatic: false,
      kind: 1,
      operator: someAddress,
      receiver: someAddress,
      share: someAddress,
      shares: BigInt(99),
      status: 3,
    });

    const result = await getRequest(client, { requestId: BigInt(7) });

    expect(result.kind).toBe(1);
    expect(result.status).toBe(3);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: hemiEarnRouterAddress,
        args: [BigInt(7)],
      }),
    );
  });
});
