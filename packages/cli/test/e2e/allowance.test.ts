import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, usdc } from "./helpers.js";

const untouchedAccount = "0x000000000000000000000000000000000000dead";

describe("swap allowance", function () {
  const rpcUrl = inject("anvilUrl");

  const allowanceOnFork = ({
    account,
    token,
  }: {
    account: string;
    token: string;
  }) => [
    "swap",
    "allowance",
    "--token",
    token,
    "--account",
    account,
    "--rpc-url",
    rpcUrl,
  ];

  it("reads the allowance by symbol", async function () {
    const approved = await runCli(
      allowanceOnFork({ account: untouchedAccount, token: usdc.symbol }),
    );
    expect(approved).toBe("0");
  });

  it("reads the allowance by address", async function () {
    const approved = await runCli(
      allowanceOnFork({ account: untouchedAccount, token: usdc.address }),
    );
    expect(approved).toBe("0");
  });

  it("rejects an invalid --account", async function () {
    const { exitCode, stderr } = await runCliRaw(
      allowanceOnFork({ account: "notanaddress", token: usdc.symbol }),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a token the protocol does not know", async function () {
    const { exitCode, stderr } = await runCliRaw(
      allowanceOnFork({ account: untouchedAccount, token: "USDX" }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      'Not a whitelisted or pegged token: "USDX"',
    );
  });
});
