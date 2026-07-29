import { describe, expect, it } from "vitest";

import { parseAddress, parseGateway, parseSlippage } from "../src/lib/args.js";

describe("parseAddress", function () {
  it("returns the checksummed address for valid lowercase input", function () {
    expect(parseAddress("0xdad503f8b9d42bb7af3afc588358d30163e4416f")).toBe(
      "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F",
    );
  });

  it("throws a clean error for an invalid address", function () {
    expect(() => parseAddress("not-an-address")).toThrow(
      'Invalid address: "not-an-address"',
    );
  });
});

describe("parseGateway", function () {
  it("returns the checksummed address for an enabled gateway", function () {
    expect(parseGateway("0xdad503f8b9d42bb7af3afc588358d30163e4416f")).toBe(
      "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F",
    );
  });

  it("throws for a valid address that is not an enabled gateway", function () {
    expect(() =>
      parseGateway("0x0000000000000000000000000000000000000001"),
    ).toThrow(
      'Not an enabled gateway: "0x0000000000000000000000000000000000000001"',
    );
  });

  it("throws for a malformed address", function () {
    expect(() => parseGateway("nope")).toThrow('Invalid address: "nope"');
  });
});

describe("parseSlippage", function () {
  it("returns the percent for integers within range", function () {
    expect(parseSlippage("0")).toBe(0);
    expect(parseSlippage("5")).toBe(5);
    expect(parseSlippage("100")).toBe(100);
  });

  it("accepts a single decimal digit", function () {
    expect(parseSlippage("0.2")).toBe(0.2);
    expect(parseSlippage("12.5")).toBe(12.5);
  });

  it("accepts an empty value", function () {
    expect(parseSlippage("")).toBe(0);
  });

  it("accepts a trailing dot", function () {
    expect(parseSlippage("0.")).toBe(0);
  });

  it("normalizes a comma separator to a dot", function () {
    expect(parseSlippage("0,2")).toBe(0.2);
    expect(parseSlippage("12,")).toBe(12);
  });

  it("throws for a comma with more than one decimal digit", function () {
    expect(() => parseSlippage("0,25")).toThrow('Invalid slippage: "0,25"');
  });

  it("throws for more than one decimal digit", function () {
    expect(() => parseSlippage("0.25")).toThrow('Invalid slippage: "0.25"');
  });

  it("throws for non-numeric values", function () {
    expect(() => parseSlippage("abc")).toThrow('Invalid slippage: "abc"');
    expect(() => parseSlippage("-1")).toThrow('Invalid slippage: "-1"');
    expect(() => parseSlippage(".5")).toThrow('Invalid slippage: ".5"');
    expect(() => parseSlippage("1.2.3")).toThrow('Invalid slippage: "1.2.3"');
  });

  it("throws for values above the maximum", function () {
    expect(() => parseSlippage("101")).toThrow(
      'Slippage cannot exceed 100%: "101"',
    );
    expect(() => parseSlippage("100.1")).toThrow(
      'Slippage cannot exceed 100%: "100.1"',
    );
  });
});
