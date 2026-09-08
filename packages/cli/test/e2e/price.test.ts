import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, usdc, vusd } from "./helpers.ts";

type Price = {
  latestPrice: string;
  unitPrice: string;
};

describe("swap price", function () {
  const rpcUrl = inject("anvilUrl");

  const priceOnFork = (extra: string[] = []) => [
    "swap",
    "price",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it("reads the price by symbol", async function () {
    const price = await runCli<Price>(priceOnFork(["--token", usdc.symbol]));

    expect(price.latestPrice).toMatch(/^\d+$/);
    expect(price.unitPrice).toMatch(/^\d+$/);
    expect(BigInt(price.latestPrice)).toBeGreaterThan(0n);
    expect(BigInt(price.unitPrice)).toBeGreaterThan(0n);
  });

  it("reads the price by address", async function () {
    const price = await runCli<Price>(priceOnFork(["--token", usdc.address]));

    expect(BigInt(price.latestPrice)).toBeGreaterThan(0n);
  });

  it("rejects a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw(
      priceOnFork(["--token", vusd.symbol]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a whitelisted token: "${vusd.symbol}"`,
    );
  });

  it("rejects a missing --token", async function () {
    const { exitCode, stderr } = await runCliRaw(priceOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--token <token>'");
  });
});
