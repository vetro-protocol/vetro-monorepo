import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, usdc, vusd } from "./helpers.ts";

describe("swap max-out", function () {
  const rpcUrl = inject("anvilUrl");

  const maxOutOnFork = (extra: string[] = []) => [
    "swap",
    "max-out",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  // `Treasury.withdrawable` returns 0 rather than reverting for a token it does
  // not hold, so a wrong gateway or a wrong tokenOut would read as a plain "0".
  it("reads the treasury reserves by symbol", async function () {
    const maxOut = await runCli(maxOutOnFork(["--token", usdc.symbol]));
    expect(maxOut).toMatch(/^\d+$/);
    expect(BigInt(maxOut)).toBeGreaterThan(0n);
  });

  it("reads the same reserves by address as by symbol", async function () {
    const bySymbol = await runCli(maxOutOnFork(["--token", usdc.symbol]));
    const byAddress = await runCli(maxOutOnFork(["--token", usdc.address]));
    expect(byAddress).toBe(bySymbol);
  });

  it("rejects a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw(
      maxOutOnFork(["--token", vusd.symbol]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a whitelisted token: "${vusd.symbol}"`,
    );
  });

  it("rejects a missing --token", async function () {
    const { exitCode, stderr } = await runCliRaw(maxOutOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--token <token>'");
  });
});
