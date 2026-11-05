import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getAssetData } from "../../src/actions/public/getAssetData.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};
const address = "0x000000000000000000000000000000000000bEEF" as Address;
const asset = "0x000000000000000000000000000000000000dEaD" as Address;
const share = "0x4444444444444444444444444444444444444444" as Address;
const remoteAsset = "0x000000000000000000000000000000000000c0DE" as Address;
const remoteShare = "0x000000000000000000000000000000000000FEeD" as Address;

describe("getAssetData", function () {
  it("forwards the asset to `assetsData` and returns the struct", async function () {
    vi.mocked(readContract).mockResolvedValue({
      enabled: true,
      remoteAsset,
      remoteShare,
      share,
    });

    const result = await getAssetData(client, { address, asset });

    expect(result).toEqual({
      enabled: true,
      remoteAsset,
      remoteShare,
      share,
    });
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address,
        args: [asset],
        functionName: "assetsData",
      }),
    );
  });

  it("preserves enabled=false for disabled assets", async function () {
    vi.mocked(readContract).mockResolvedValue({
      enabled: false,
      remoteAsset,
      remoteShare,
      share,
    });

    const result = await getAssetData(client, { address, asset });

    expect(result.enabled).toBe(false);
  });

  it("rejects a zero asset", async function () {
    await expect(
      getAssetData(client, { address, asset: zeroAddress }),
    ).rejects.toThrow("Asset address is invalid");
  });

  it("rejects an undefined client", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getAssetData(undefined, { address, asset }),
    ).rejects.toThrow("Client is not defined");
  });

  it("rejects an invalid asset", async function () {
    await expect(
      getAssetData(client, { address, asset: "0xnope" }),
    ).rejects.toThrow("Asset address is invalid");
  });

  it("rejects an invalid router address", async function () {
    await expect(
      getAssetData(client, { address: "0xnope" as Address, asset }),
    ).rejects.toThrow("Router address is invalid");
  });
});
