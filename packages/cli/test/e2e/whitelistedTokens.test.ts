import { gateways } from "@vetro-protocol/core";
import { type Address, getAddress, isAddressEqual } from "viem";
import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, setDepositActive, usdc, vusd } from "./helpers.ts";

type WhitelistedToken = {
  address: Address;
  decimals: number;
  depositActive: boolean;
  symbol: string;
  withdrawActive: boolean;
};

describe("swap whitelisted-tokens", function () {
  const rpcUrl = inject("anvilUrl");
  const { address: vusdGateway } = gateways.find((gateway) =>
    isAddressEqual(gateway.peggedToken, vusd.address),
  )!;

  const whitelistedTokensOnFork = (extra: string[] = []) => [
    "swap",
    "whitelisted-tokens",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it("describes the gateway's tokens with what it takes to pick one", async function () {
    const tokens = await runCli<WhitelistedToken[]>(
      whitelistedTokensOnFork(["--gateway", vusdGateway]),
    );

    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens).toContainEqual({
      address: usdc.address,
      decimals: usdc.decimals,
      depositActive: true,
      symbol: usdc.symbol,
      withdrawActive: true,
    });
  });

  it("accepts a non-checksummed gateway address", async function () {
    const tokens = await runCli<WhitelistedToken[]>(
      whitelistedTokensOnFork(["--gateway", vusdGateway.toLowerCase()]),
    );

    expect(tokens.length).toBeGreaterThan(0);
    expect(
      tokens.every((token) => getAddress(token.address) === token.address),
    ).toBe(true);
  });

  it("reports a token whose deposits are paused", async function () {
    try {
      await setDepositActive({
        active: false,
        gateway: vusdGateway,
        rpcUrl,
        token: usdc.address,
      });

      const tokens = await runCli<WhitelistedToken[]>(
        whitelistedTokensOnFork(["--gateway", vusdGateway]),
      );
      const paused = tokens.find((token) => token.symbol === usdc.symbol);
      expect(paused?.depositActive).toBe(false);
      expect(paused?.withdrawActive).toBe(true);
    } finally {
      await setDepositActive({
        active: true,
        gateway: vusdGateway,
        rpcUrl,
        token: usdc.address,
      });
    }
  });

  it("rejects an address that is not an enabled gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(
      whitelistedTokensOnFork(["--gateway", usdc.address]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`Not an enabled gateway: "${usdc.address}"`);
  });

  it("rejects an invalid gateway address", async function () {
    const { exitCode, stderr } = await runCliRaw(
      whitelistedTokensOnFork(["--gateway", "notanaddress"]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a missing --gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(whitelistedTokensOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--gateway <addr>'");
  });
});
