import { getAssetData } from "@vetro-protocol/hemi-earn/actions";
import { type Address, zeroAddress } from "viem";
import { describe, expect, it, vi } from "vitest";

import {
  type createHemiClient,
  resolveShareByAsset,
} from "../../src/hemi-earn/router.ts";

vi.mock("@vetro-protocol/hemi-earn/actions", () => ({
  getAssetData: vi.fn(),
}));

const client = {} as ReturnType<typeof createHemiClient>;
const share: Address = "0x00000000000000000000000000000000000000D1";

const assetData = (assetShare: Address) => ({
  enabled: true,
  remoteAsset: zeroAddress,
  remoteShare: zeroAddress,
  share: assetShare,
});

describe("hemi-earn/router/resolveShareByAsset", function () {
  it("returns the lowercase share and reads each asset only once", async function () {
    const asset = "0x00000000000000000000000000000000000000c1";
    vi.mocked(getAssetData).mockResolvedValue(assetData(share));

    expect(await resolveShareByAsset({ asset, client })).toBe(
      share.toLowerCase(),
    );
    expect(
      await resolveShareByAsset({ asset: asset.toUpperCase(), client }),
    ).toBe(share.toLowerCase());
    expect(getAssetData).toHaveBeenCalledTimes(1);
  });

  it("returns null when the Router does not know the asset, and reads it again later", async function () {
    const asset = "0x00000000000000000000000000000000000000c2";
    vi.mocked(getAssetData)
      .mockResolvedValueOnce(assetData(zeroAddress))
      .mockResolvedValueOnce(assetData(share));

    expect(await resolveShareByAsset({ asset, client })).toBeNull();
    expect(await resolveShareByAsset({ asset, client })).toBe(
      share.toLowerCase(),
    );
    expect(getAssetData).toHaveBeenCalledTimes(2);
  });

  it("reads the asset again after a failed read", async function () {
    const asset = "0x00000000000000000000000000000000000000c3";
    vi.mocked(getAssetData)
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValueOnce(assetData(share));

    await expect(resolveShareByAsset({ asset, client })).rejects.toThrow(
      "rate limited",
    );
    expect(await resolveShareByAsset({ asset, client })).toBe(
      share.toLowerCase(),
    );
    expect(getAssetData).toHaveBeenCalledTimes(2);
  });
});
