import { gatewayAddresses } from "@vetro-protocol/gateway";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  runCli,
  runCliRaw,
  setRedeemQueueEnabled,
  setWithdrawalDelay,
  usdc,
} from "./helpers.ts";

describe("swap cooldown-enabled", function () {
  const rpcUrl = inject("anvilUrl");
  const [gateway] = gatewayAddresses;

  const cooldownEnabledOnFork = (extra: string[] = []) => [
    "swap",
    "cooldown-enabled",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  let restoreQueue: (() => Promise<void>) | undefined;

  beforeAll(async function () {
    restoreQueue = await setRedeemQueueEnabled({
      enabled: true,
      gateway,
      rpcUrl,
    });
  });

  afterAll(() => restoreQueue?.());

  it("prints true when the delay is enabled", async function () {
    await setWithdrawalDelay({ enabled: true, gateway, rpcUrl });

    const enabled = await runCli<boolean>(
      cooldownEnabledOnFork(["--gateway", gateway]),
    );

    expect(enabled).toBe(true);
  });

  it("prints false when the delay is disabled", async function () {
    await setWithdrawalDelay({ enabled: false, gateway, rpcUrl });

    const enabled = await runCli<boolean>(
      cooldownEnabledOnFork(["--gateway", gateway]),
    );

    expect(enabled).toBe(false);
  });

  it("accepts a non-checksummed gateway address", async function () {
    await setWithdrawalDelay({ enabled: true, gateway, rpcUrl });

    const enabled = await runCli<boolean>(
      cooldownEnabledOnFork(["--gateway", gateway.toLowerCase()]),
    );

    expect(enabled).toBe(true);
  });

  it("rejects an address that is not an enabled gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(
      cooldownEnabledOnFork(["--gateway", usdc.address]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`Not an enabled gateway: "${usdc.address}"`);
  });

  it("rejects an invalid gateway address", async function () {
    const { exitCode, stderr } = await runCliRaw(
      cooldownEnabledOnFork(["--gateway", "notanaddress"]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a missing --gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(cooldownEnabledOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--gateway <addr>'");
  });
});
