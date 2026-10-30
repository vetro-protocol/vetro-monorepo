import { zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import {
  type createHemiClient,
  resolveShareByAsset,
} from "../../src/hemi-earn/router.ts";

vi.mock("viem/actions", () => ({ readContract: vi.fn() }));

const client = {} as ReturnType<typeof createHemiClient>;
const share = "0x00000000000000000000000000000000000000D1";

const assetData = (assetShare: string) => ({
  enabled: true,
  remoteAsset: zeroAddress,
  remoteShare: zeroAddress,
  share: assetShare,
});

describe("hemi-earn/router/resolveShareByAsset", function () {
  it("returns the lowercase share and reads each asset only once", async function () {
    const asset = "0x00000000000000000000000000000000000000c1";
    vi.mocked(readContract).mockResolvedValue(assetData(share));

    expect(await resolveShareByAsset({ asset, client })).toBe(
      share.toLowerCase(),
    );
    expect(
      await resolveShareByAsset({ asset: asset.toUpperCase(), client }),
    ).toBe(share.toLowerCase());
    expect(readContract).toHaveBeenCalledTimes(1);
  });

  it("returns null when the Router does not know the asset, and reads it again later", async function () {
    const asset = "0x00000000000000000000000000000000000000c2";
    vi.mocked(readContract)
      .mockResolvedValueOnce(assetData(zeroAddress))
      .mockResolvedValueOnce(assetData(share));

    expect(await resolveShareByAsset({ asset, client })).toBeNull();
    expect(await resolveShareByAsset({ asset, client })).toBe(
      share.toLowerCase(),
    );
    expect(readContract).toHaveBeenCalledTimes(2);
  });

  it("reads the asset again after a failed read", async function () {
    const asset = "0x00000000000000000000000000000000000000c3";
    vi.mocked(readContract)
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValueOnce(assetData(share));

    await expect(resolveShareByAsset({ asset, client })).rejects.toThrow(
      "rate limited",
    );
    expect(await resolveShareByAsset({ asset, client })).toBe(
      share.toLowerCase(),
    );
    expect(readContract).toHaveBeenCalledTimes(2);
  });
});
