import type { Address } from "viem";
import { hemi, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { portalUsdPrice } from "../../src/liquidity/portal-usd-price.ts";

const hemiBtc: Address = "0x06ea695B91700071B161A434fED42D1DcbAD9f00";
const hemiChainHemiBtc: Address = "0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28";
const hemiChainVetBtc: Address = "0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4";
const hemiChainVusd: Address = "0xD3599AE62EE280709A22268a46d23164214e345B";
const usdt: Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const vetBtc: Address = "0xf196C68233464A16CFDa319a47c21f4cECa62001";
const vusd: Address = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";

describe("liquidity/portalUsdPrice", function () {
  it("prices a USD-pegged token at 1 and other tokens at their portal price", function () {
    const prices = { USDT: "0.999", VUSD: "0.97" };
    expect(
      [vusd, usdt].map((address) =>
        portalUsdPrice({ address, chainId: mainnet.id, prices }),
      ),
    ).toEqual([1, 0.999]);
  });

  it("prices a BTC-pegged token at the portal BTC price", function () {
    expect(
      portalUsdPrice({
        address: vetBtc,
        chainId: mainnet.id,
        prices: { BTC: "76800" },
      }),
    ).toBe(76800);
  });

  it("returns undefined for a BTC-pegged token when the portal has no BTC price", function () {
    expect(
      portalUsdPrice({
        address: vetBtc,
        chainId: mainnet.id,
        prices: { WBTC: "76500" },
      }),
    ).toBeUndefined();
  });

  it("returns undefined for a missing or non-numeric portal price", function () {
    expect(
      [null, "not-a-price"].map((price) =>
        portalUsdPrice({
          address: usdt,
          chainId: mainnet.id,
          prices: { USDT: price as unknown as string },
        }),
      ),
    ).toEqual([undefined, undefined]);
  });

  it("returns undefined for a token with no portal price", function () {
    expect(
      portalUsdPrice({
        address: hemiBtc,
        chainId: mainnet.id,
        prices: { BTC: "76800" },
      }),
    ).toBeUndefined();
  });

  it("prices the pegged tokens of another chain at their peg", function () {
    const prices = { BTC: "76800", VETBTC: "70000", VUSD: "0.97" };
    expect(
      [hemiChainVusd, hemiChainVetBtc].map((address) =>
        portalUsdPrice({ address, chainId: hemi.id, prices }),
      ),
    ).toEqual([1, 76800]);
  });

  it("prices a token of another chain by its symbol", function () {
    expect(
      portalUsdPrice({
        address: hemiChainHemiBtc,
        chainId: hemi.id,
        prices: { HEMIBTC: "76646.4" },
      }),
    ).toBe(76646.4);
  });

  it("returns undefined for an address that is not on the given chain", function () {
    expect(
      portalUsdPrice({
        address: hemiChainVusd,
        chainId: mainnet.id,
        prices: { VUSD: "1" },
      }),
    ).toBeUndefined();
  });
});
