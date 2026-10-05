import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import { decimals, symbol } from "viem-erc20/actions";
import { asset } from "viem-erc4626/actions";
import { describe, expect, it, vi } from "vitest";

import { fetchTrackedTokens } from "./fetchTrackedTokens";

const gatewayAddress = "0x1111111111111111111111111111111111111111";
const peggedAddress = "0x2222222222222222222222222222222222222222";
const vaultAddress = "0x3333333333333333333333333333333333333333";

vi.mock("../lib/client", () => ({ client: {} }));

vi.mock("@vetro-protocol/earn", () => ({
  stakingVaultAddresses: ["0x3333333333333333333333333333333333333333"],
}));

vi.mock("@vetro-protocol/gateway", () => ({
  gateways: [
    {
      address: "0x1111111111111111111111111111111111111111",
      pegBaseSymbol: "USD",
    },
  ],
}));

vi.mock("@vetro-protocol/gateway/actions", () => ({
  getPeggedToken: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  decimals: vi.fn(),
  symbol: vi.fn(),
}));

vi.mock("viem-erc4626/actions", () => ({
  asset: vi.fn(),
}));

const tokenData: Record<string, { decimals: number; symbol: string }> = {
  [peggedAddress]: { decimals: 6, symbol: "PEG" },
  [vaultAddress]: { decimals: 18, symbol: "sPEG" },
};

describe("fetchTrackedTokens", function () {
  it("stores the underlying pegged token decimals on share tokens", async function () {
    vi.mocked(getPeggedToken).mockResolvedValue(peggedAddress);
    vi.mocked(asset).mockResolvedValue(peggedAddress);
    vi.mocked(decimals).mockImplementation(
      async (_client, { address }) => tokenData[address].decimals,
    );
    vi.mocked(symbol).mockImplementation(
      async (_client, { address }) => tokenData[address].symbol,
    );

    const tokens = await fetchTrackedTokens();

    expect(getPeggedToken).toHaveBeenCalledWith(expect.anything(), {
      address: gatewayAddress,
    });
    expect(tokens).toEqual([
      {
        address: peggedAddress,
        decimals: 6,
        extensions: { priceSymbol: "USD" },
        symbol: "PEG",
      },
      {
        address: vaultAddress,
        assetDecimals: 6,
        decimals: 18,
        extensions: { isVaultShare: true, priceSymbol: "USD" },
        symbol: "sPEG",
      },
    ]);
  });
});
