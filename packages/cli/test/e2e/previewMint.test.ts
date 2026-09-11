import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, swapAmount, usdc, vusd } from "./helpers.ts";

describe("swap preview-mint", function () {
  const rpcUrl = inject("anvilUrl");

  const previewMintOnFork = (extra: string[] = []) => [
    "swap",
    "preview-mint",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it("reads the preview by symbol", async function () {
    const preview = await runCli(
      previewMintOnFork(["--from", usdc.symbol, "--amount", swapAmount]),
    );
    expect(preview).toMatch(/^\d+$/);
  });

  it("reads the same preview by address as by symbol", async function () {
    const bySymbol = await runCli(
      previewMintOnFork(["--from", usdc.symbol, "--amount", swapAmount]),
    );
    const byAddress = await runCli(
      previewMintOnFork(["--from", usdc.address, "--amount", swapAmount]),
    );
    expect(byAddress).toBe(bySymbol);
  });

  it("rejects a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw(
      previewMintOnFork(["--from", vusd.symbol, "--amount", swapAmount]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a whitelisted token: "${vusd.symbol}"`,
    );
  });

  it.for([
    [["--amount", swapAmount], "required option '--from <token>'"],
    [["--from", usdc.symbol], "required option '--amount <n>'"],
  ] as const)(
    "rejects a missing option: %s",
    async function ([extra, message]) {
      const { exitCode, stderr } = await runCliRaw(
        previewMintOnFork([...extra]),
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );

  it.for(["0", "abc", "-1"])(
    "rejects --amount %s as a usage error",
    async function (amount) {
      const { exitCode, stderr } = await runCliRaw(
        previewMintOnFork(["--from", usdc.symbol, "--amount", amount]),
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain("option '--amount");
    },
  );
});
