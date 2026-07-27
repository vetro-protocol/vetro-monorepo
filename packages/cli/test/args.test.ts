import { describe, expect, it } from "vitest";

import { parseAddress, parseGateway } from "../src/lib/args.js";

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
