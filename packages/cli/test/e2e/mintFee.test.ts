import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, usdc, vusd } from "./helpers.ts";

describe("swap mint-fee", function () {
  const rpcUrl = inject("anvilUrl");

  const mintFeeOnFork = (extra: string[] = []) => [
    "swap",
    "mint-fee",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it("reads the mint fee by symbol", async function () {
    const fee = await runCli(mintFeeOnFork(["--token", usdc.symbol]));
    expect(fee).toMatch(/^\d+$/);
  });

  it("reads the mint fee by address", async function () {
    const fee = await runCli(mintFeeOnFork(["--token", usdc.address]));
    expect(fee).toMatch(/^\d+$/);
  });

  it("rejects a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw(
      mintFeeOnFork(["--token", vusd.symbol]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a whitelisted token: "${vusd.symbol}"`,
    );
  });

  it("rejects a missing --token", async function () {
    const { exitCode, stderr } = await runCliRaw(mintFeeOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--token <token>'");
  });
});
