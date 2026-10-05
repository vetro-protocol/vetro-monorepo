import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { type TrackedToken } from "../lib/types";

import { fetchAssetsPerShare } from "./fetchAssetsPerShare";
import { fetchShareTokenRates } from "./fetchShareTokenRates";

vi.mock("./fetchAssetsPerShare", () => ({ fetchAssetsPerShare: vi.fn() }));

vi.mock("./fetchTrackedTokens", () => ({ fetchTrackedTokens: vi.fn() }));

const vusdAddress = "0x1111111111111111111111111111111111111111";
const sVusdAddress = "0x476310E34D2810f7d79C43A74E4D79405bd7a925";
const sVetBtcAddress = "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e";

const tokens: TrackedToken[] = [
  {
    address: vusdAddress,
    decimals: 18,
    extensions: { priceSymbol: "USD" },
    symbol: "VUSD",
  },
  {
    address: sVusdAddress,
    assetDecimals: 18,
    decimals: 18,
    extensions: { isVaultShare: true, priceSymbol: "USD" },
    symbol: "sVUSD",
  },
  {
    address: sVetBtcAddress,
    assetDecimals: 8,
    decimals: 18,
    extensions: { isVaultShare: true, priceSymbol: "BTC" },
    symbol: "svetBTC",
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

describe("fetchShareTokenRates", function () {
  it("keys each vault rate by its mainnet address and every bridged deployment", async function () {
    vi.mocked(fetchAssetsPerShare).mockImplementation(async function ({
      token,
    }) {
      if (token.address === sVusdAddress) {
        return 1.0249;
      }
      if (token.address === sVetBtcAddress) {
        return 1.01;
      }
      throw new Error("unexpected token");
    });

    const rates = await fetchShareTokenRates({
      queryClient: createQueryClient(),
    });

    expect(rates).toEqual({
      ...ratesOf({ addresses: sVusdDeployments, rate: 1.0249 }),
      ...ratesOf({ addresses: svetBtcDeployments, rate: 1.01 }),
    });
    // One read per vault, fanned out to the bridged addresses.
    expect(fetchAssetsPerShare).toHaveBeenCalledTimes(2);
  });

  it("omits the mainnet and bridged addresses of a vault whose read fails", async function () {
    vi.mocked(fetchAssetsPerShare).mockImplementation(async function ({
      token,
    }) {
      if (token.address === sVusdAddress) {
        return 1.0249;
      }
      throw new Error("revert");
    });

    const rates = await fetchShareTokenRates({
      queryClient: createQueryClient(),
    });

    expect(rates).toEqual(
      ratesOf({ addresses: sVusdDeployments, rate: 1.0249 }),
    );
  });
});
