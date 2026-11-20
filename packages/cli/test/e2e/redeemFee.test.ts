import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getRedeemFee } from "@vetro-protocol/gateway/actions";
import { describe, expect, inject, it } from "vitest";

import { createClients, runCli, runCliRaw, usdc, vusd } from "./helpers.ts";

describe("swap redeem-fee", function () {
  const rpcUrl = inject("anvilUrl");

  const redeemFeeOnFork = (extra: string[] = []) => [
    "swap",
    "redeem-fee",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it("reads the redeem fee by symbol", async function () {
    const { publicClient } = createClients(rpcUrl);
    const expected = await getRedeemFee(publicClient, {
      address: gatewayAddresses[0],
      token: usdc.address,
    });
    const fee = await runCli(redeemFeeOnFork(["--token", usdc.symbol]));
    expect(fee).toBe(expected.toString());
  });

  it("reads the redeem fee by address", async function () {
    const { publicClient } = createClients(rpcUrl);
    const expected = await getRedeemFee(publicClient, {
      address: gatewayAddresses[0],
      token: usdc.address,
    });
    const fee = await runCli(redeemFeeOnFork(["--token", usdc.address]));
    expect(fee).toBe(expected.toString());
  });

  it("rejects a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw(
      redeemFeeOnFork(["--token", vusd.symbol]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a whitelisted token: "${vusd.symbol}"`,
    );
  });

  it("rejects a missing --token", async function () {
    const { exitCode, stderr } = await runCliRaw(redeemFeeOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--token <token>'");
  });
});
