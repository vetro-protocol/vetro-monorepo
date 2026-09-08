import { gatewayAddresses } from "@vetro-protocol/gateway";
import { isInstantRedeemWhitelisted } from "@vetro-protocol/gateway/actions";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  createClients,
  runCli,
  runCliRaw,
  setInstantRedeemWhitelisted,
  usdc,
} from "./helpers.ts";

describe("swap is-instant-redeem", function () {
  const rpcUrl = inject("anvilUrl");
  const [gateway] = gatewayAddresses;
  const account = "0x00000000000000000000000000000000000000A1";

  const isInstantRedeemOnFork = (extra: string[] = []) => [
    "swap",
    "is-instant-redeem",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  let whitelistedBefore: boolean;

  beforeAll(async function () {
    const { publicClient } = createClients(rpcUrl);
    whitelistedBefore = await isInstantRedeemWhitelisted(publicClient, {
      account,
      address: gateway,
    });
  });

  afterAll(() =>
    setInstantRedeemWhitelisted({
      account,
      gateway,
      rpcUrl,
      whitelisted: whitelistedBefore,
    }),
  );

  it("prints true for a whitelisted account", async function () {
    await setInstantRedeemWhitelisted({
      account,
      gateway,
      rpcUrl,
      whitelisted: true,
    });

    const instant = await runCli<boolean>(
      isInstantRedeemOnFork(["--account", account, "--gateway", gateway]),
    );

    expect(instant).toBe(true);
  });

  it("prints false for an account that is not whitelisted", async function () {
    await setInstantRedeemWhitelisted({
      account,
      gateway,
      rpcUrl,
      whitelisted: false,
    });

    const instant = await runCli<boolean>(
      isInstantRedeemOnFork(["--account", account, "--gateway", gateway]),
    );

    expect(instant).toBe(false);
  });

  it("accepts a non-checksummed account address", async function () {
    await setInstantRedeemWhitelisted({
      account,
      gateway,
      rpcUrl,
      whitelisted: true,
    });

    const instant = await runCli<boolean>(
      isInstantRedeemOnFork([
        "--account",
        account.toLowerCase(),
        "--gateway",
        gateway.toLowerCase(),
      ]),
    );

    expect(instant).toBe(true);
  });

  it("rejects an address that is not an enabled gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(
      isInstantRedeemOnFork(["--account", account, "--gateway", usdc.address]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`Not an enabled gateway: "${usdc.address}"`);
  });

  it("rejects an invalid account address", async function () {
    const { exitCode, stderr } = await runCliRaw(
      isInstantRedeemOnFork([
        "--account",
        "notanaddress",
        "--gateway",
        gateway,
      ]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a missing --account", async function () {
    const { exitCode, stderr } = await runCliRaw(
      isInstantRedeemOnFork(["--gateway", gateway]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--account <addr>'");
  });

  it("rejects a missing --gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(
      isInstantRedeemOnFork(["--account", account]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--gateway <addr>'");
  });
});
