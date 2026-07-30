import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, usdc } from "./helpers.js";

const untouchedAccount = "0x000000000000000000000000000000000000dead";

describe("swap allowance", function () {
  const rpcUrl = inject("anvilUrl");

  it("reads the allowance by symbol", async function () {
    const approved = await runCli({
      args: [
        "swap",
        "allowance",
        "--token",
        usdc.symbol,
        "--account",
        untouchedAccount,
      ],
      rpcUrl,
    });
    expect(approved).toBe("0");
  });

  it("reads the allowance by address", async function () {
    const approved = await runCli({
      args: [
        "swap",
        "allowance",
        "--token",
        usdc.address,
        "--account",
        untouchedAccount,
      ],
      rpcUrl,
    });
    expect(approved).toBe("0");
  });

  it("rejects an invalid --account", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: [
        "swap",
        "allowance",
        "--token",
        usdc.symbol,
        "--account",
        "notanaddress",
      ],
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a token the protocol does not know", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: [
        "swap",
        "allowance",
        "--token",
        "USDX",
        "--account",
        untouchedAccount,
      ],
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      'Not a whitelisted or pegged token: "USDX"',
    );
  });
});
