import { type Address, type Client, getAddress, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getAgentAddress } from "../../src/actions/public/getAgentAddress.ts";
import { hemiEarnRouterAddress } from "../../src/constants.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};
const address = "0x000000000000000000000000000000000000bEEF" as Address;
const agentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const peer = `0x000000000000000000000000${agentAddress.slice(2)}`;

describe("getAgentAddress", function () {
  it("reads `peerAddress` from the Router and decodes it into an address", async function () {
    vi.mocked(readContract).mockResolvedValue(peer);

    const result = await getAgentAddress(client, { address });

    expect(result).toBe(getAddress(agentAddress));
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        functionName: "peerAddress",
      }),
    );
  });

  it("falls back to the default router address", async function () {
    vi.mocked(readContract).mockResolvedValue(peer);

    await getAgentAddress(client);

    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: hemiEarnRouterAddress,
        functionName: "peerAddress",
      }),
    );
  });

  it("rejects a missing client", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getAgentAddress(undefined, { address }),
    ).rejects.toThrow("Client is not defined");
  });

  it("rejects a zero router address", async function () {
    await expect(
      getAgentAddress(client, { address: zeroAddress }),
    ).rejects.toThrow("Router address is invalid");
  });

  it("rejects an invalid router address", async function () {
    await expect(
      getAgentAddress(client, { address: "0xnotanaddress" as Address }),
    ).rejects.toThrow("Router address is invalid");
  });
});
