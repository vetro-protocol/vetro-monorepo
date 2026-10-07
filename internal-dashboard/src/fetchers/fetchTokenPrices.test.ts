import { QueryClient } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isAddressEqual } from "viem";
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

// Every deployment of each share in @vetro-protocol/core, lowercased: mainnet,
// arbitrum, base, bsc, hemi and optimism.
const sVusdDeployments = [
  "0x476310e34d2810f7d79c43a74e4d79405bd7a925",
  "0x50c580227764b621c0433bb6ab756c781c495ce7",
  "0xb174750002068862dfe7df38f974a950f189386a",
  "0xc141b66ee4262ba46ea29578955c274fd4a96515",
  "0xfe875cc86cc6bc2e93ab330d6b2c408c3cd79710",
  "0x92273ca3356379c2fe870fe3805cc5e7ab6d19c6",
];
const svetBtcDeployments = [
  "0x0cb9d84d4bcec8d3d5b2d99a6f07f4605325987e",
  "0x54181404a037757eb5271ee4a02ca51844f25eaa",
  "0x781aea37b81f3cf3fb9a97e9568bdaf36d2def3d",
  "0x37d8c0afeef48aa9d925475cf6c73e4d8c74d931",
  "0xd8d63de3b64bd06d99f8f5ad8b78ed2fe7525ec0",
  "0x62d2a7d31e8a61a7acd472c98c657e053eb01b96",
];

const ratesOf = ({ addresses, rate }: { addresses: string[]; rate: number }) =>
  Object.fromEntries(addresses.map((address) => [address, rate]));

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
      if (isAddressEqual(token.address, btcShareAddress)) {
        return 1.25;
      }
      if (isAddressEqual(token.address, usdShareAddress)) {
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
    // The rates land in the shared cache for the pool pages to reuse, also
    // keyed by the bridged deployments of each share in @vetro-protocol/core.
    expect(queryClient.getQueryData(["share-token-rates"])).toEqual({
      [btcShareAddress]: 1.25,
      [usdShareAddress]: 1.5,
      ...ratesOf({ addresses: svetBtcDeployments, rate: 1.25 }),
      ...ratesOf({ addresses: sVusdDeployments, rate: 1.5 }),
    });
  });
});
