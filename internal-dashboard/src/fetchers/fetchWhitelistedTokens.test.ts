import { getPeggedToken, getTreasury } from "@vetro-protocol/gateway/actions";
import { getWhitelistedTokens } from "@vetro-protocol/treasury/actions";
import { decimals, symbol } from "viem-erc20/actions";
import { describe, expect, it, vi } from "vitest";

import { fetchWhitelistedTokens } from "./fetchWhitelistedTokens";

// On-chain reads return lowercase addresses; the expected values are the
// well-known EIP-55 checksummed forms, written out by hand.
const btcGateway = "0x1111111111111111111111111111111111111111";
const btcPegged = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const btcPeggedChecksummed = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const btcTreasury = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
const btcTreasuryChecksummed = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const usdGateway = "0x2222222222222222222222222222222222222222";
const usdPegged = "0x6b175474e89094c44da98b954eedeac495271d0f";
const usdPeggedChecksummed = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const usdTreasury = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const usdTreasuryChecksummed = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const usdc = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const usdcChecksummed = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const wbtc = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";
const wbtcChecksummed = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";

vi.mock("../lib/client", () => ({ client: {} }));

vi.mock("@vetro-protocol/gateway", () => ({
  gateways: [
    {
      address: "0x2222222222222222222222222222222222222222",
      pegBaseSymbol: "USD",
    },
    {
      address: "0x1111111111111111111111111111111111111111",
      pegBaseSymbol: "BTC",
    },
  ],
}));

vi.mock("@vetro-protocol/gateway/actions", () => ({
  getPeggedToken: vi.fn(),
  getTreasury: vi.fn(),
}));

vi.mock("@vetro-protocol/treasury/actions", () => ({
  getWhitelistedTokens: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  decimals: vi.fn(),
  symbol: vi.fn(),
}));

const peggedByGateway: Record<string, `0x${string}`> = {
  [btcGateway]: btcPegged,
  [usdGateway]: usdPegged,
};
const treasuryByGateway: Record<string, `0x${string}`> = {
  [btcGateway]: btcTreasury,
  [usdGateway]: usdTreasury,
};
const whitelistByTreasury: Record<string, `0x${string}`[]> = {
  [btcTreasuryChecksummed]: [wbtc],
  [usdTreasuryChecksummed]: [usdc],
};
const tokenData: Record<string, { decimals: number; symbol: string }> = {
  [usdcChecksummed]: { decimals: 6, symbol: "USDC" },
  [wbtcChecksummed]: { decimals: 8, symbol: "WBTC" },
};

describe("fetchWhitelistedTokens", function () {
  it("tags each whitelisted token with its own gateway's checksummed pegged token", async function () {
    vi.mocked(getPeggedToken).mockImplementation(
      async (_client, { address }) => peggedByGateway[address],
    );
    vi.mocked(getTreasury).mockImplementation(
      async (_client, { address }) => treasuryByGateway[address],
    );
    vi.mocked(getWhitelistedTokens).mockImplementation(
      async (_client, { address }) => whitelistByTreasury[address],
    );
    vi.mocked(decimals).mockImplementation(
      async (_client, { address }) => tokenData[address].decimals,
    );
    vi.mocked(symbol).mockImplementation(
      async (_client, { address }) => tokenData[address].symbol,
    );

    const tokens = await fetchWhitelistedTokens();

    expect(getPeggedToken).toHaveBeenCalledWith(expect.anything(), {
      address: usdGateway,
    });
    expect(getPeggedToken).toHaveBeenCalledWith(expect.anything(), {
      address: btcGateway,
    });
    expect(tokens).toEqual([
      {
        address: usdcChecksummed,
        decimals: 6,
        peggedTokenAddress: usdPeggedChecksummed,
        symbol: "USDC",
      },
      {
        address: wbtcChecksummed,
        decimals: 8,
        peggedTokenAddress: btcPeggedChecksummed,
        symbol: "WBTC",
      },
    ]);
  });
});
