import { knownTokens } from "@vetro-protocol/core";
import { type Address, getAddress, isAddressEqual } from "viem";
import { hemi, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { pegDeviation } from "./exchangeRate";
import { tokenAddresses } from "./tokenAddresses";
import {
  type PoolCoin,
  type TrackedToken,
  type WhitelistedToken,
} from "./types";

// Mainnet addresses, so tokenAddresses() fans each tracked token out to its
// knownTokens deployments on other chains (Hemi included).
const vusd: Address = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";
const vetBtc: Address = "0xf196C68233464A16CFDa319a47c21f4cECa62001";
const sVusd: Address = "0x476310E34D2810f7d79C43A74E4D79405bd7a925";
const sVetBtc: Address = "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e";
const usdt: Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const wbtc: Address = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const crvUsd: Address = "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E";
// A Hemi USDT; not in knownTokens, so it can only match by symbol.
const hemiUsdt: Address = "0x3333333333333333333333333333333333333333";

const hemiDeployment = function (symbol: string) {
  const known = knownTokens.find(
    (token) => token.chainId === hemi.id && token.symbol === symbol,
  );
  if (!known) {
    throw new Error(`No Hemi deployment of ${symbol} in knownTokens`);
  }
  return known.address;
};

const hemiVusd = hemiDeployment("VUSD");
const hemiSVusd = hemiDeployment("sVUSD");
const hemiVetBtc = hemiDeployment("vetBTC");

const trackedTokens: TrackedToken[] = [
  {
    address: vusd,
    decimals: 18,
    extensions: { priceSymbol: "USD" },
    symbol: "VUSD",
  },
  {
    address: vetBtc,
    decimals: 18,
    extensions: { priceSymbol: "WBTC" },
    symbol: "vetBTC",
  },
  {
    address: sVusd,
    assetAddress: vusd,
    assetDecimals: 18,
    decimals: 18,
    extensions: { isVaultShare: true },
    symbol: "sVUSD",
  },
  {
    address: sVetBtc,
    assetAddress: vetBtc,
    assetDecimals: 18,
    decimals: 18,
    extensions: { isVaultShare: true },
    symbol: "svetBTC",
  },
];

const whitelistedTokens: WhitelistedToken[] = [
  { address: usdt, decimals: 6, peggedTokenAddress: vusd, symbol: "USDT" },
  { address: wbtc, decimals: 8, peggedTokenAddress: vetBtc, symbol: "WBTC" },
];

type Coin = Pick<PoolCoin, "address" | "symbol">;

const coin = (address: Address, symbol: string): Coin => ({ address, symbol });

const vusdCoin = coin(vusd, "VUSD");
const vetBtcCoin = coin(vetBtc, "vetBTC");
const sVusdCoin = coin(sVusd, "sVUSD");
const sVetBtcCoin = coin(sVetBtc, "svetBTC");
const usdtCoin = coin(usdt, "USDT");
const wbtcCoin = coin(wbtc, "WBTC");
const crvUsdCoin = coin(crvUsd, "crvUSD");

const sVusdRate = 1.0249;
const sVetBtcRate = 1.0031;

const shareRates = {
  [sVetBtc.toLowerCase()]: sVetBtcRate,
  [sVusd.toLowerCase()]: sVusdRate,
};

const deviationOf = ({
  base,
  chainId = mainnet.id,
  quote,
  rate,
  rates = shareRates,
  whitelist = whitelistedTokens,
}: {
  base: Coin;
  chainId?: number;
  quote: Coin;
  rate: number;
  rates?: Partial<Record<string, number>>;
  whitelist?: WhitelistedToken[];
}) =>
  pegDeviation({
    base,
    chainId,
    quote,
    rate,
    shareRates: rates,
    trackedTokens,
    whitelistedTokens: whitelist,
  });

describe("pegDeviation", function () {
  describe("rule 1: a pegged token against its gateway's whitelisted tokens", function () {
    it("measures USDT/VUSD drift from 1", function () {
      expect(
        deviationOf({ base: usdtCoin, quote: vusdCoin, rate: 1.002 }),
      ).toEqual({
        deviation: (1.002 - 1) * 100,
        expectedRate: 1,
        hasShareLeg: false,
      });
    });

    it("measures VUSD/USDT drift from 1", function () {
      expect(
        deviationOf({ base: vusdCoin, quote: usdtCoin, rate: 1.002 }),
      ).toEqual({
        deviation: (1.002 - 1) * 100,
        expectedRate: 1,
        hasShareLeg: false,
      });
    });

    it("measures vetBTC/WBTC drift from 1", function () {
      const result = deviationOf({
        base: vetBtcCoin,
        quote: wbtcCoin,
        rate: 0.994,
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.hasShareLeg).toBe(false);
      expect(result?.deviation).toBeCloseTo(-0.6, 10);
    });

    it("measures WBTC/vetBTC drift from 1", function () {
      const result = deviationOf({
        base: wbtcCoin,
        quote: vetBtcCoin,
        rate: 1.005,
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.deviation).toBeCloseTo(0.5, 10);
    });

    it("reports a 30% depeg instead of hiding it", function () {
      const result = deviationOf({
        base: vusdCoin,
        quote: usdtCoin,
        rate: 0.7,
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.hasShareLeg).toBe(false);
      expect(result?.deviation).toBeCloseTo(-30, 10);
    });

    it("reports a depeg above 10% upward", function () {
      const result = deviationOf({
        base: wbtcCoin,
        quote: vetBtcCoin,
        rate: 1.5,
      });

      expect(result?.deviation).toBeCloseTo(50, 10);
    });

    it("matches a pool address whose case differs from the whitelist entry", function () {
      const result = deviationOf({
        base: coin(vusd.toLowerCase() as Address, "VUSD"),
        // Address match, even under a symbol the whitelist doesn't use.
        quote: coin(usdt.toLowerCase() as Address, "USD₮"),
        rate: 1.001,
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.deviation).toBeCloseTo(0.1, 10);
    });
  });

  describe("rule 1 across chains", function () {
    it("uses Hemi deployments that differ from the mainnet addresses", function () {
      expect(isAddressEqual(hemiVusd, vusd)).toBe(false);
      expect(isAddressEqual(hemiSVusd, sVusd)).toBe(false);
      expect(isAddressEqual(hemiVetBtc, vetBtc)).toBe(false);
    });

    it("matches a Hemi USDT against the Hemi VUSD by symbol", function () {
      const result = deviationOf({
        base: coin(hemiUsdt, "USDT"),
        chainId: hemi.id,
        quote: coin(hemiVusd, "VUSD"),
        rate: 0.998,
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.hasShareLeg).toBe(false);
      expect(result?.deviation).toBeCloseTo(-0.2, 10);
    });

    it("matches the whitelisted symbol ignoring case", function () {
      const result = deviationOf({
        base: coin(hemiVusd, "VUSD"),
        chainId: hemi.id,
        quote: coin(hemiUsdt, "usdt"),
        rate: 1.003,
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.deviation).toBeCloseTo(0.3, 10);
    });

    it("matches a Hemi vetBTC against WBTC by symbol", function () {
      const result = deviationOf({
        base: coin(hemiVetBtc, "vetBTC"),
        chainId: hemi.id,
        quote: coin("0x4444444444444444444444444444444444444444", "WBTC"),
        rate: 0.99,
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.deviation).toBeCloseTo(-1, 10);
    });

    it("does not match a bridged variant with a different symbol", function () {
      expect(
        deviationOf({
          base: coin(hemiVusd, "VUSD"),
          chainId: hemi.id,
          quote: coin(hemiUsdt, "USDT.e"),
          rate: 1.0001,
        }),
      ).toBeUndefined();
    });

    it("does not match a mainnet coin by symbol at a non-whitelisted address", function () {
      // A permissionless pool can list any token named "USDT" on mainnet.
      expect(
        deviationOf({
          base: coin(hemiUsdt, "USDT"),
          chainId: mainnet.id,
          quote: vusdCoin,
          rate: 1.0001,
        }),
      ).toBeUndefined();
    });

    it("matches the same coin by symbol on Hemi", function () {
      const result = deviationOf({
        base: coin(hemiUsdt, "USDT"),
        chainId: hemi.id,
        quote: vusdCoin,
        rate: 1.0001,
      });

      expect(result?.expectedRate).toBe(1);
    });
  });

  describe("rule 2: a share token against its vault's pegged token", function () {
    it("measures sVUSD/VUSD drift from the vault rate", function () {
      const result = deviationOf({
        base: sVusdCoin,
        quote: vusdCoin,
        rate: 1.02424,
      });

      expect(result?.expectedRate).toBe(sVusdRate);
      expect(result?.hasShareLeg).toBe(true);
      expect(result?.deviation).toBeCloseTo((1.02424 / 1.0249 - 1) * 100, 10);
      // ≈ -0.0644%, not the +2.4% a 1:1 assumption would give.
      expect(result?.deviation).toBeCloseTo(-0.0644, 3);
    });

    it("measures VUSD/sVUSD drift from the inverse vault rate", function () {
      const rate = 1 / 1.02424;
      const result = deviationOf({ base: vusdCoin, quote: sVusdCoin, rate });

      expect(result?.expectedRate).toBeCloseTo(1 / 1.0249, 12);
      expect(result?.hasShareLeg).toBe(true);
      expect(result?.deviation).toBeCloseTo((rate * 1.0249 - 1) * 100, 10);
    });

    it("measures svetBTC/vetBTC drift from its own vault rate", function () {
      const result = deviationOf({
        base: sVetBtcCoin,
        quote: vetBtcCoin,
        rate: 1.01,
      });

      expect(result?.expectedRate).toBe(sVetBtcRate);
      expect(result?.hasShareLeg).toBe(true);
      expect(result?.deviation).toBeCloseTo((1.01 / 1.0031 - 1) * 100, 10);
    });

    it("measures vetBTC/svetBTC drift from the inverse vault rate", function () {
      const result = deviationOf({
        base: vetBtcCoin,
        quote: sVetBtcCoin,
        rate: 0.995,
      });

      expect(result?.expectedRate).toBeCloseTo(1 / 1.0031, 12);
      expect(result?.deviation).toBeCloseTo((0.995 * 1.0031 - 1) * 100, 10);
    });

    it("compares the Hemi sVUSD against the Hemi VUSD at the vault rate", function () {
      const result = deviationOf({
        base: coin(hemiSVusd, "sVUSD"),
        chainId: hemi.id,
        quote: coin(hemiVusd, "VUSD"),
        rate: 1.02424,
        // As fetchShareTokenRates stores it: the mainnet vault rate fanned out
        // to the lowercased bridged address.
        rates: { [hemiSVusd.toLowerCase()]: sVusdRate },
      });

      expect(tokenAddresses(trackedTokens[2])).toContain(hemiSVusd);
      expect(result?.expectedRate).toBe(sVusdRate);
      expect(result?.hasShareLeg).toBe(true);
      expect(result?.deviation).toBeCloseTo((1.02424 / 1.0249 - 1) * 100, 10);
    });

    it("reports a share pair 50% off the vault rate", function () {
      const rate = 1.0249 * 1.5;
      const result = deviationOf({ base: sVusdCoin, quote: vusdCoin, rate });

      expect(result?.expectedRate).toBe(sVusdRate);
      expect(result?.deviation).toBeCloseTo(50, 10);
    });

    it("returns undefined when the vault rate is missing", function () {
      expect(
        deviationOf({
          base: sVusdCoin,
          quote: vusdCoin,
          rate: 1.02424,
          rates: {},
        }),
      ).toBeUndefined();
    });

    it("returns undefined when the vault rate is 0", function () {
      expect(
        deviationOf({
          base: vusdCoin,
          quote: sVusdCoin,
          rate: 1,
          rates: { [sVusd.toLowerCase()]: 0 },
        }),
      ).toBeUndefined();
    });

    it("keeps hasShareLeg when the vault rate is exactly 1", function () {
      expect(
        deviationOf({
          base: sVusdCoin,
          quote: vusdCoin,
          rate: 1.002,
          rates: { [sVusd.toLowerCase()]: 1 },
        }),
      ).toEqual({
        deviation: (1.002 - 1) * 100,
        expectedRate: 1,
        hasShareLeg: true,
      });
    });

    it("still works when the whitelist is empty", function () {
      const result = deviationOf({
        base: sVusdCoin,
        quote: vusdCoin,
        rate: 1.02424,
        whitelist: [],
      });

      expect(result?.expectedRate).toBe(sVusdRate);
    });

    it("matches a checksummed share address against a lowercase pool address", function () {
      const lowercase = sVusd.toLowerCase() as Address;
      const result = deviationOf({
        base: coin(lowercase, "sVUSD"),
        quote: vusdCoin,
        rate: 1.02424,
      });

      expect(getAddress(lowercase)).not.toBe(lowercase);
      expect(result?.expectedRate).toBe(sVusdRate);
    });
  });

  describe("rule 3: every other pair gets no deviation", function () {
    it.each([
      // A stable that isn't on VUSD's whitelist, however close to 1.
      ["VUSD/crvUSD", vusdCoin, crvUsdCoin, 1.0001],
      ["crvUSD/VUSD", crvUsdCoin, vusdCoin, 1],
      // Share tokens only peg to their own vault's pegged token.
      ["sVUSD/USDT", sVusdCoin, usdtCoin, 1.0249],
      ["crvUSD/sVUSD", crvUsdCoin, sVusdCoin, 1 / 1.0249],
      ["sVUSD/vetBTC", sVusdCoin, vetBtcCoin, 1],
      ["svetBTC/VUSD", sVetBtcCoin, vusdCoin, 1],
      ["svetBTC/WBTC", sVetBtcCoin, wbtcCoin, 1.0031],
      ["sVUSD/svetBTC", sVusdCoin, sVetBtcCoin, 1],
      // Whitelisted for the other gateway.
      ["VUSD/WBTC", vusdCoin, wbtcCoin, 1],
      ["vetBTC/USDT", vetBtcCoin, usdtCoin, 1],
      // Two pegged tokens, two whitelisted tokens, two unknown tokens.
      ["VUSD/vetBTC", vusdCoin, vetBtcCoin, 1],
      ["USDT/WBTC", usdtCoin, wbtcCoin, 1],
      [
        "unknown/unknown",
        crvUsdCoin,
        coin("0x5555555555555555555555555555555555555555", "USDC"),
        1,
      ],
    ])("returns undefined for %s", function (_, base, quote, rate) {
      expect(deviationOf({ base, quote, rate })).toBeUndefined();
    });

    it("returns undefined for VUSD/USDT when the whitelist is empty", function () {
      expect(
        deviationOf({
          base: vusdCoin,
          quote: usdtCoin,
          rate: 1,
          whitelist: [],
        }),
      ).toBeUndefined();
    });
  });
});
