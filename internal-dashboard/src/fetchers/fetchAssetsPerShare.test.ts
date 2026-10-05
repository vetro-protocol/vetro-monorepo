import { asset, convertToAssets } from "viem-erc4626/actions";
import { describe, expect, it, vi } from "vitest";

import { client } from "../lib/client";

import { fetchAssetsPerShare } from "./fetchAssetsPerShare";

vi.mock("../lib/client", () => ({ client: {} }));

vi.mock("viem-erc4626/actions", () => ({
  asset: vi.fn(),
  convertToAssets: vi.fn(),
}));

const shareAddress = "0x1111111111111111111111111111111111111111";

describe("fetchAssetsPerShare", function () {
  it("converts one whole share using the stored asset decimals", async function () {
    // 1.05 units of a 6-decimals asset per whole 18-decimals share.
    vi.mocked(convertToAssets).mockResolvedValue(1_050_000n);

    const rate = await fetchAssetsPerShare({
      token: {
        address: shareAddress,
        assetDecimals: 6,
        decimals: 18,
        extensions: { isVaultShare: true },
        symbol: "sTEST",
      },
    });

    expect(rate).toBe(1.05);
    expect(convertToAssets).toHaveBeenCalledTimes(1);
    expect(convertToAssets).toHaveBeenCalledWith(client, {
      address: shareAddress,
      shares: 1_000_000_000_000_000_000n,
    });
    expect(asset).not.toHaveBeenCalled();
  });

  it("throws without reading the vault when assetDecimals is missing", async function () {
    await expect(
      fetchAssetsPerShare({
        token: {
          address: shareAddress,
          decimals: 18,
          extensions: { isVaultShare: true },
          symbol: "sTEST",
        },
      }),
    ).rejects.toThrow(`Missing asset decimals for share token ${shareAddress}`);
    expect(convertToAssets).not.toHaveBeenCalled();
  });
});
