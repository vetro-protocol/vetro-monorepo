import { type Address, getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { pegDeviation } from "./exchangeRate";
import { tokenAddresses } from "./tokenAddresses";

const peggedToken: Address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const stablecoin: Address = "0x1111111111111111111111111111111111111111";
const shareToken: Address = "0xfedcbafedcbafedcbafedcbafedcbafedcbafedc";
const otherShareToken: Address = "0xa0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1";

const sharePrice = 1.0249;

describe("pegDeviation", function () {
  it("measures drift from 1 for a plain peg pair", function () {
    const result = pegDeviation({
      base: peggedToken,
      quote: stablecoin,
      rate: 1.002,
      shareRates: {},
      shareTokenAddresses: [],
    });

    expect(result?.expectedRate).toBe(1);
    expect(result?.deviation).toBeCloseTo(0.2, 10);
  });

  it("measures drift from the vault rate when the share token is the base", function () {
    const result = pegDeviation({
      base: shareToken,
      quote: peggedToken,
      rate: 1.02424,
      shareRates: { [shareToken]: sharePrice },
      shareTokenAddresses: [shareToken],
    });

    expect(result?.expectedRate).toBe(sharePrice);
    // ≈ -0.0644%, not the +2.4% a 1:1 assumption would give.
    expect(result?.deviation).toBeCloseTo((1.02424 / 1.0249 - 1) * 100, 10);
    expect(result?.deviation).toBeCloseTo(-0.0644, 3);
  });

  it("measures drift from the inverse vault rate when the share token is the quote", function () {
    const rate = 1 / 1.02424;
    const result = pegDeviation({
      base: peggedToken,
      quote: shareToken,
      rate,
      shareRates: { [shareToken]: sharePrice },
      shareTokenAddresses: [shareToken],
    });

    expect(result?.expectedRate).toBeCloseTo(1 / 1.0249, 12);
    expect(result?.deviation).toBeCloseTo((rate * 1.0249 - 1) * 100, 10);
  });

  it("returns undefined when the share token's rate is missing", function () {
    expect(
      pegDeviation({
        base: shareToken,
        quote: peggedToken,
        rate: 1.02424,
        shareRates: {},
        shareTokenAddresses: [shareToken],
      }),
    ).toBeUndefined();
  });

  it("returns undefined when the share token's rate is 0", function () {
    expect(
      pegDeviation({
        base: peggedToken,
        quote: shareToken,
        rate: 1,
        shareRates: { [shareToken]: 0 },
        shareTokenAddresses: [shareToken],
      }),
    ).toBeUndefined();
  });

  it("returns undefined for a non-peg pair", function () {
    expect(
      pegDeviation({
        base: peggedToken,
        quote: stablecoin,
        rate: 60000,
        shareRates: {},
        shareTokenAddresses: [],
      }),
    ).toBeUndefined();
    expect(
      pegDeviation({
        base: peggedToken,
        quote: stablecoin,
        rate: 1 / 60000,
        shareRates: {},
        shareTokenAddresses: [],
      }),
    ).toBeUndefined();
  });

  it("returns undefined when a share pair is far from the vault rate", function () {
    expect(
      pegDeviation({
        base: shareToken,
        quote: peggedToken,
        rate: 1.5,
        shareRates: { [shareToken]: sharePrice },
        shareTokenAddresses: [shareToken],
      }),
    ).toBeUndefined();
  });

  it("treats a 1.1x difference as outside the peg and just below it as inside", function () {
    expect(
      pegDeviation({
        base: peggedToken,
        quote: stablecoin,
        rate: 1.1,
        shareRates: {},
        shareTokenAddresses: [],
      }),
    ).toBeUndefined();

    const below = pegDeviation({
      base: peggedToken,
      quote: stablecoin,
      rate: 1.09,
      shareRates: {},
      shareTokenAddresses: [],
    });
    expect(below?.expectedRate).toBe(1);
    expect(below?.deviation).toBeCloseTo(9, 10);
  });

  it("finds the share token when the address case differs from the tracked entry", function () {
    const result = pegDeviation({
      // Pool reports the checksummed address; tracked list and rate map are lowercase.
      base: getAddress(shareToken),
      quote: peggedToken,
      rate: 1.02424,
      shareRates: { [shareToken]: sharePrice },
      shareTokenAddresses: [shareToken],
    });

    expect(getAddress(shareToken)).not.toBe(shareToken);
    expect(result?.expectedRate).toBe(sharePrice);
    expect(result?.deviation).toBeCloseTo((1.02424 / 1.0249 - 1) * 100, 10);
  });

  it("finds the share token when the tracked entry is checksummed and the pool is lowercase", function () {
    const result = pegDeviation({
      base: shareToken,
      quote: peggedToken,
      rate: 1.02424,
      shareRates: { [shareToken]: sharePrice },
      shareTokenAddresses: [getAddress(shareToken)],
    });

    expect(result?.expectedRate).toBe(sharePrice);
  });

  it("uses the ratio of both vault rates when both legs are share tokens", function () {
    const otherSharePrice = 1.1;
    const rate = 0.93;
    const result = pegDeviation({
      base: shareToken,
      quote: otherShareToken,
      rate,
      shareRates: {
        [otherShareToken]: otherSharePrice,
        [shareToken]: sharePrice,
      },
      shareTokenAddresses: [shareToken, otherShareToken],
    });

    const expectedRate = 1.0249 / 1.1;
    expect(result?.expectedRate).toBeCloseTo(expectedRate, 12);
    expect(result?.deviation).toBeCloseTo((rate / expectedRate - 1) * 100, 10);
  });

  it("compares a bridged share token against its mainnet vault rate", function () {
    const hemiSVusd: Address = "0xfe875CC86cC6BC2E93ab330D6b2c408C3Cd79710";
    const result = pegDeviation({
      base: hemiSVusd,
      quote: peggedToken,
      rate: 1.02424,
      // As fetchShareTokenRates stores it: the mainnet vault rate fanned out to
      // the lowercased bridged address.
      shareRates: { [hemiSVusd.toLowerCase()]: sharePrice },
      shareTokenAddresses: tokenAddresses({
        address: "0x476310E34D2810f7d79C43A74E4D79405bd7a925",
        assetDecimals: 18,
        decimals: 18,
        extensions: { isVaultShare: true },
        symbol: "sVUSD",
      }),
    });

    expect(result?.expectedRate).toBe(sharePrice);
    // ≈ -0.0644%, not the +2.424% of treating the Hemi share as a 1:1 coin.
    expect(result?.deviation).toBeCloseTo((1.02424 / 1.0249 - 1) * 100, 10);
    expect(result?.deviation).toBeCloseTo(-0.0644, 3);
  });
  describe("hasShareLeg", function () {
    it("is false for a plain peg pair", function () {
      const result = pegDeviation({
        base: peggedToken,
        quote: stablecoin,
        rate: 1.002,
        shareRates: {},
        shareTokenAddresses: [shareToken],
      });

      expect(result).toEqual({
        deviation: (1.002 - 1) * 100,
        expectedRate: 1,
        hasShareLeg: false,
      });
    });

    it("is true when the share token is the base", function () {
      const result = pegDeviation({
        base: shareToken,
        quote: peggedToken,
        rate: 1.02424,
        shareRates: { [shareToken]: sharePrice },
        shareTokenAddresses: [shareToken],
      });

      expect(result?.hasShareLeg).toBe(true);
    });

    it("is true when the share token is the quote", function () {
      const result = pegDeviation({
        base: peggedToken,
        quote: shareToken,
        rate: 1 / 1.02424,
        shareRates: { [shareToken]: sharePrice },
        shareTokenAddresses: [shareToken],
      });

      expect(result?.hasShareLeg).toBe(true);
    });

    it("is true when the share token's vault rate is exactly 1", function () {
      const result = pegDeviation({
        base: shareToken,
        quote: peggedToken,
        rate: 1.002,
        shareRates: { [shareToken]: 1 },
        shareTokenAddresses: [shareToken],
      });

      expect(result).toEqual({
        deviation: (1.002 - 1) * 100,
        expectedRate: 1,
        hasShareLeg: true,
      });
    });

    it("is true when both legs are share tokens with equal vault rates", function () {
      const result = pegDeviation({
        base: shareToken,
        quote: otherShareToken,
        rate: 0.999,
        shareRates: {
          [otherShareToken]: sharePrice,
          [shareToken]: sharePrice,
        },
        shareTokenAddresses: [shareToken, otherShareToken],
      });

      expect(result?.expectedRate).toBe(1);
      expect(result?.deviation).toBeCloseTo((0.999 - 1) * 100, 10);
      expect(result?.hasShareLeg).toBe(true);
    });

    it("is true when the share leg's address case differs from the tracked entry", function () {
      const result = pegDeviation({
        base: peggedToken,
        quote: getAddress(shareToken),
        rate: 1,
        shareRates: { [shareToken]: 1 },
        shareTokenAddresses: [shareToken],
      });

      expect(result?.hasShareLeg).toBe(true);
    });
  });
});
