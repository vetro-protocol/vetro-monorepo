import { gatewayAddresses } from "@vetro-protocol/gateway";
import { type Address, isAddress } from "viem";
import { afterEach, describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw } from "./helpers.js";

const [gateway] = gatewayAddresses;

describe("--rpc-url", function () {
  const rpcUrl = inject("anvilUrl");
  const originalRpcUrl = process.env.RPC_URL;

  const readTreasury = (extra: string[]) =>
    runCli<Address>(["swap", "treasury", "--gateway", gateway, ...extra]);

  afterEach(function () {
    if (originalRpcUrl === undefined) {
      delete process.env.RPC_URL;
    } else {
      process.env.RPC_URL = originalRpcUrl;
    }
  });

  it("reads from the endpoint given before the subcommand", async function () {
    const treasury = await runCli<Address>([
      "--rpc-url",
      rpcUrl,
      "swap",
      "treasury",
      "--gateway",
      gateway,
    ]);
    expect(isAddress(treasury)).toBe(true);
  });

  it("falls back to RPC_URL when the flag is absent", async function () {
    process.env.RPC_URL = rpcUrl;
    expect(isAddress(await readTreasury([]))).toBe(true);
  });

  it("prefers the flag over RPC_URL", async function () {
    process.env.RPC_URL = "http://127.0.0.1:1";
    expect(isAddress(await readTreasury(["--rpc-url", rpcUrl]))).toBe(true);
  });

  it("rejects an empty RPC_URL rather than treating it as unset", async function () {
    process.env.RPC_URL = "";
    const { exitCode, stderr } = await runCliRaw([
      "swap",
      "treasury",
      "--gateway",
      gateway,
    ]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("Invalid RPC URL");
  });

  it("rejects a malformed URL as a usage error", async function () {
    const { exitCode, stderr } = await runCliRaw([
      "swap",
      "treasury",
      "--gateway",
      gateway,
      "--rpc-url",
      "nope",
    ]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("Invalid RPC URL");
  });

  // A usage error is raised before any endpoint is resolved, so it can't go
  // through printError -- commander echoes the value and needs its own redaction.
  it("keeps a rejected endpoint out of the usage error", async function () {
    const secret = "wss://eth-mainnet.example/v2/SUPER_SECRET_KEY";
    const { exitCode, stderr } = await runCliRaw([
      "swap",
      "treasury",
      "--gateway",
      gateway,
      "--rpc-url",
      secret,
    ]);
    expect(exitCode).not.toBe(0);
    expect(stderr).not.toContain("SUPER_SECRET_KEY");
    expect(stderr).toContain("[redacted]");
  });

  it("keeps a rejected RPC_URL out of the usage error", async function () {
    process.env.RPC_URL = "wss://eth-mainnet.example/v2/SUPER_SECRET_KEY";
    const { exitCode, stderr } = await runCliRaw([
      "swap",
      "treasury",
      "--gateway",
      gateway,
    ]);
    expect(exitCode).not.toBe(0);
    expect(stderr).not.toContain("SUPER_SECRET_KEY");
    expect(stderr).toContain("[redacted]");
  });

  // The value is whatever was typed, so redaction must not rewrite the message
  // around it -- only the quoted occurrences are replaced.
  it("does not mangle the message when the value is short", async function () {
    const { stderr } = await runCliRaw([
      "swap",
      "treasury",
      "--gateway",
      gateway,
      "--rpc-url",
      "a",
    ]);
    expect(stderr).toContain("is invalid");
    expect(stderr).toContain("Invalid RPC URL");
  });

  it("reports an unreachable endpoint without leaking it", async function () {
    const { exitCode, stderr } = await runCliRaw([
      "swap",
      "treasury",
      "--gateway",
      gateway,
      "--rpc-url",
      "http://127.0.0.1:1",
    ]);
    expect(exitCode).toBe(1);
    expect(stderr).not.toContain("127.0.0.1:1");
    expect(stderr).toContain("[redacted]");
  });
});
