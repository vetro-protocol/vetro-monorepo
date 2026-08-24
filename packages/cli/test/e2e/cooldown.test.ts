import { gatewayAddresses } from "@vetro-protocol/gateway";
import {
  getWithdrawalDelay,
  getWithdrawalDelayEnabled,
} from "@vetro-protocol/gateway/actions";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  createClients,
  runCli,
  runCliRaw,
  setWithdrawalDelay,
  usdc,
} from "./helpers.ts";

describe("swap cooldown", function () {
  const rpcUrl = inject("anvilUrl");
  const [gateway] = gatewayAddresses;
  const delay = 300n;

  const cooldownOnFork = (extra: string[] = []) => [
    "swap",
    "cooldown",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  let delayBefore: bigint;
  let enabledBefore: boolean;

  beforeAll(async function () {
    const { publicClient } = createClients(rpcUrl);
    [delayBefore, enabledBefore] = await Promise.all([
      getWithdrawalDelay(publicClient, { address: gateway }),
      getWithdrawalDelayEnabled(publicClient, { address: gateway }),
    ]);
  });

  afterAll(() =>
    setWithdrawalDelay({
      delay: delayBefore,
      enabled: enabledBefore,
      gateway,
      rpcUrl,
    }),
  );

  it("prints the withdrawal delay when the delay is enabled", async function () {
    await setWithdrawalDelay({ delay, enabled: true, gateway, rpcUrl });

    const cooldown = await runCli(cooldownOnFork(["--gateway", gateway]));

    expect(cooldown).toBe(delay.toString());
  });

  it("accepts a non-checksummed gateway address", async function () {
    const cooldown = await runCli(
      cooldownOnFork(["--gateway", gateway.toLowerCase()]),
    );
    expect(cooldown).toBe(delay.toString());
  });

  it("rejects an address that is not an enabled gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(
      cooldownOnFork(["--gateway", usdc.address]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`Not an enabled gateway: "${usdc.address}"`);
  });

  it("rejects an invalid gateway address", async function () {
    const { exitCode, stderr } = await runCliRaw(
      cooldownOnFork(["--gateway", "notanaddress"]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a missing --gateway", async function () {
    const { exitCode, stderr } = await runCliRaw(cooldownOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--gateway <addr>'");
  });

  it("prints 0 when the delay is disabled", async function () {
    await setWithdrawalDelay({ delay, enabled: false, gateway, rpcUrl });

    const cooldown = await runCli(cooldownOnFork(["--gateway", gateway]));

    expect(cooldown).toBe("0");
  });
});
