import { QueryClient } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { describe, expect, it, vi } from "vitest";

import { type TrackedToken } from "../lib/types";

import { fetchAssetsPerShare } from "./fetchAssetsPerShare";
import { fetchTokenPrices } from "./fetchTokenPrices";

vi.mock("fetch-plus-plus", () => ({ default: vi.fn() }));

vi.mock("./fetchAssetsPerShare", () => ({ fetchAssetsPerShare: vi.fn() }));

vi.mock("./fetchTrackedTokens", () => ({ fetchTrackedTokens: vi.fn() }));

const usdPegAddress = "0x1111111111111111111111111111111111111111";
const usdShareAddress = "0x2222222222222222222222222222222222222222";
const btcPegAddress = "0x3333333333333333333333333333333333333333";
const btcShareAddress = "0x4444444444444444444444444444444444444444";
// Mixed case to check prices are keyed by the lowercased address.
const unratedShareAddress = "0x55555555555555555555555555555555555555aA";

const tokens: TrackedToken[] = [
  {
    address: usdPegAddress,
    decimals: 18,
    extensions: { priceSymbol: "USD" },
    symbol: "VUSD",
  },
  {
    address: usdShareAddress,
    assetDecimals: 18,
    decimals: 18,
    extensions: { isVaultShare: true, priceSymbol: "USD" },
    symbol: "sVUSD",
  },
  {
    address: btcPegAddress,
    decimals: 8,
    extensions: { priceSymbol: "BTC" },
    symbol: "vetBTC",
  },
  {
    address: btcShareAddress,
    assetDecimals: 8,
    decimals: 18,
    extensions: { isVaultShare: true, priceSymbol: "BTC" },
    symbol: "svetBTC",
  },
  {
    address: unratedShareAddress,
    assetDecimals: 18,
    decimals: 18,
    extensions: { isVaultShare: true, priceSymbol: "USD" },
    symbol: "sOTHER",
  },
];

const createQueryClient = function () {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(["tracked-tokens"], tokens);
  return queryClient;
};

describe("fetchTokenPrices", function () {
  it("prices share tokens from a fresh share-token-rates cache without reading the vaults", async function () {
    vi.mocked(fetch).mockResolvedValue({ prices: { BTC: "60000" } });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["share-token-rates"], {
      [btcShareAddress]: 1.25,
      [usdShareAddress]: 1.5,
    });

    const prices = await fetchTokenPrices({ queryClient });

    // Share price = peg USD price × assets per share. The unrated share is absent.
    expect(prices).toEqual({
      [btcPegAddress]: 60000,
      [btcShareAddress]: 75000,
      [usdPegAddress]: 1,
      [usdShareAddress]: 1.5,
    });
    expect(fetchAssetsPerShare).not.toHaveBeenCalled();
  });

  it("fetches share-token rates when not cached and omits shares whose rate read fails", async function () {
    vi.mocked(fetch).mockResolvedValue({ prices: { BTC: "60000" } });
    vi.mocked(fetchAssetsPerShare).mockImplementation(async function ({
      token,
    }) {
      if (token.address === btcShareAddress) {
        return 1.25;
      }
      if (token.address === usdShareAddress) {
        return 1.5;
      }
      throw new Error("revert");
    });
    const queryClient = createQueryClient();

    const prices = await fetchTokenPrices({ queryClient });

    expect(prices).toEqual({
      [btcPegAddress]: 60000,
      [btcShareAddress]: 75000,
      [usdPegAddress]: 1,
      [usdShareAddress]: 1.5,
    });
    expect(fetchAssetsPerShare).toHaveBeenCalledTimes(3);
    // The rates land in the shared cache for the pool pages to reuse.
    expect(queryClient.getQueryData(["share-token-rates"])).toEqual({
      [btcShareAddress]: 1.25,
      [usdShareAddress]: 1.5,
    });
  });
});
