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
      amountOutMin: 40n,
      asset: someAddress,
      assets: 100n,
      automatic: true,
      kind: 0,
      operator: someAddress,
      receiver: someAddress,
      share: someAddress,
      shares: 50n,
      status: 1,
    };
    vi.mocked(readContract).mockResolvedValue(request);

    const result = await getRequest(client, {
      address,
      requestId: 1n,
    });

    expect(result).toEqual(request);
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [1n],
        functionName: "requests",
      }),
    );
  });

  it("rejects a non-positive requestId", async function () {
    await expect(
      getRequest(client, { address, requestId: 0n }),
    ).rejects.toThrow("Request ID must be greater than zero");

    await expect(
      getRequest(client, { address, requestId: -1n }),
    ).rejects.toThrow("Request ID must be greater than zero");
  });

  it("reads from the default Router address when address is omitted", async function () {
    vi.mocked(readContract).mockResolvedValue({
      amountOutMin: 0n,
      asset: someAddress,
      assets: 0n,
      automatic: false,
      kind: 1,
      operator: someAddress,
      receiver: someAddress,
      share: someAddress,
      shares: 99n,
      status: 3,
    });

    await getRequest(client, { requestId: 7n });

    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: hemiEarnRouterAddress,
        args: [7n],
      }),
    );
  });
});
