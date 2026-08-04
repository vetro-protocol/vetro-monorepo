import { gatewayAddresses } from "@vetro-protocol/gateway";
import { type Address, getAddress } from "viem";
import { describe, expect, inject, it } from "vitest";

import { runCli, runCliRaw, usdc } from "./helpers.js";

describe("swap treasury", function () {
  const rpcUrl = inject("anvilUrl");

  const treasuryOnFork = (extra: string[] = []) => [
    "swap",
    "treasury",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it.for(gatewayAddresses)(
    "prints the treasury of gateway %s",
    async function (gateway) {
      const treasury = await runCli<Address>(
        treasuryOnFork(["--gateway", gateway]),
      );
      expect(getAddress(treasury)).toBe(treasury);
    },
  );

  it("accepts a non-checksummed gateway address", async function () {
    const [gateway] = gatewayAddresses;
    const treasury = await runCli<Address>(
      treasuryOnFork(["--gateway", gateway.toLowerCase()]),
    );
    expect(getAddress(treasury)).toBe(treasury);
  });

  it("rejects an address that is not an enabled gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(
      treasuryOnFork(["--gateway", usdc.address]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`Not an enabled gateway: "${usdc.address}"`);
  });

  it("rejects an invalid gateway address", async function () {
    const { exitCode, stderr } = await runCliRaw(
      treasuryOnFork(["--gateway", "notanaddress"]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a missing --gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(treasuryOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--gateway <addr>'");
  });
});
