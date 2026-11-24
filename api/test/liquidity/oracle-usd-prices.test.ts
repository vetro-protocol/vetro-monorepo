import { getTokenConfig } from "@vetro-protocol/treasury/actions";
import { type Address, type Client, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLatestPrice } from "../../src/chainlink.ts";
import { withOracleUsdPrices } from "../../src/liquidity/oracle-usd-prices.ts";
import { portalUsdPrice } from "../../src/liquidity/portal-usd-price.ts";

vi.mock("@vetro-protocol/treasury/actions", () => ({
  getTokenConfig: vi.fn(),
}));
vi.mock("../../src/chainlink.ts", () => ({ getLatestPrice: vi.fn() }));

const client = {} as Client;
const hemiBtc: Address = "0x06ea695B91700071B161A434fED42D1DcbAD9f00";
const hemiBtcOracle: Address = "0x7Ff41654D1551F01E622e2b1050EA027a3A6C9dc";
const usdc: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const pricedByPortal = {
  BTC: "76800",
  CBBTC: "76700",
  FRXUSD: "0.999",
  USDC: "1",
  USDT: "1",
  WBTC: "76750",
};

const portalWithout = (symbol: string) =>
  Object.fromEntries(
    Object.entries(pricedByPortal).filter(([key]) => key !== symbol),
  );

const mockHemiBtcOracle = function (answer: bigint) {
  vi.mocked(getTokenConfig).mockImplementation(
    async (_client, { token }) =>
      [
        "0x0000000000000000000000000000000000000001",
        isAddressEqual(token, hemiBtc)
          ? hemiBtcOracle
          : "0x0000000000000000000000000000000000000002",
        86400n,
        true,
        true,
        8,
      ] as Awaited<ReturnType<typeof getTokenConfig>>,
  );
  vi.mocked(getLatestPrice).mockImplementation(async function ({ address }) {
    if (!isAddressEqual(address, hemiBtcOracle)) {
      throw new Error("execution reverted");
    }
    return { decimals: 18, price: answer, updatedAt: 0n };
  });
};

describe("liquidity/withOracleUsdPrices", function () {
  beforeEach(function () {
    vi.mocked(getTokenConfig).mockReset();
    vi.mocked(getLatestPrice).mockReset();
  });

  it("prices a whitelisted token with no portal price from its oracle and the peg", async function () {
    mockHemiBtcOracle(10n ** 18n);

    const prices = await withOracleUsdPrices({
      client,
      prices: Promise.resolve(pricedByPortal),
    });

    expect(
      portalUsdPrice({ address: hemiBtc, chainId: mainnet.id, prices }),
    ).toBe(76800);
  });

  it("scales the peg price by an oracle price below par", async function () {
    mockHemiBtcOracle(998n * 10n ** 15n);

    const prices = await withOracleUsdPrices({
      client,
      prices: Promise.resolve(pricedByPortal),
    });

    expect(
      portalUsdPrice({ address: hemiBtc, chainId: mainnet.id, prices }),
    ).toBe(76646.4);
  });

  it("prefers the oracle price over the portal price", async function () {
    mockHemiBtcOracle(998n * 10n ** 15n);

    const prices = await withOracleUsdPrices({
      client,
      prices: Promise.resolve({ ...pricedByPortal, HEMIBTC: "76000" }),
    });

    expect(
      portalUsdPrice({ address: hemiBtc, chainId: mainnet.id, prices }),
    ).toBe(76646.4);
  });

  it("keeps the portal price when the oracle read fails", async function () {
    mockHemiBtcOracle(10n ** 18n);

    const prices = await withOracleUsdPrices({
      client,
      prices: Promise.resolve(pricedByPortal),
    });

    expect(portalUsdPrice({ address: usdc, chainId: mainnet.id, prices })).toBe(
      1,
    );
  });

  it("keeps the portal price when the oracle answer is not positive", async function () {
    mockHemiBtcOracle(0n);

    const prices = await withOracleUsdPrices({
      client,
      prices: Promise.resolve({ ...pricedByPortal, HEMIBTC: "76000" }),
    });

    expect(
      portalUsdPrice({ address: hemiBtc, chainId: mainnet.id, prices }),
    ).toBe(76000);
  });

  it("leaves a token unpriced when the oracle and the portal have no price", async function () {
    mockHemiBtcOracle(10n ** 18n);

    const prices = await withOracleUsdPrices({
      client,
      prices: Promise.resolve(portalWithout("USDC")),
    });

    expect(
      portalUsdPrice({ address: usdc, chainId: mainnet.id, prices }),
    ).toBeUndefined();
    expect(
      portalUsdPrice({ address: hemiBtc, chainId: mainnet.id, prices }),
    ).toBe(76800);
  });

  it("leaves a token unpriced when the portal has no price for the peg unit", async function () {
    mockHemiBtcOracle(10n ** 18n);

    const prices = await withOracleUsdPrices({
      client,
      prices: Promise.resolve(portalWithout("BTC")),
    });

    expect(
      portalUsdPrice({ address: hemiBtc, chainId: mainnet.id, prices }),
    ).toBeUndefined();
  });

  it("reads the oracles while the portal prices load", async function () {
    mockHemiBtcOracle(10n ** 18n);

    void withOracleUsdPrices({
      client,
      prices: new Promise(function () {}),
    });
    await vi.waitFor(() => expect(getLatestPrice).toHaveBeenCalled());
  });
});
