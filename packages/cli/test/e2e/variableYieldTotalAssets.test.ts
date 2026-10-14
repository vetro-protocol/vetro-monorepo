import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/core";
import { symbol } from "viem-erc20/actions";
import { totalAssets } from "viem-erc4626/actions";
import { describe, expect, inject, it } from "vitest";

import {
  createClients,
  runCli,
  runCliRaw,
  usdc,
  vetBtc,
  vusd,
} from "./helpers.ts";

describe("variable-yield total-assets", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient } = createClients(rpcUrl);

  const totalAssetsOnFork = (extra: string[] = []) => [
    "variable-yield",
    "total-assets",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it("reads the total assets by pegged or share token, by symbol or address", async function () {
    const expected = await totalAssets(publicClient, { address: sVusdAddress });
    expect(expected).toBeGreaterThan(0n);
    const shareSymbol = await symbol(publicClient, { address: sVusdAddress });

    const totals: string[] = [];
    for (const token of [
      vusd.symbol,
      vusd.address,
      shareSymbol,
      sVusdAddress,
    ]) {
      totals.push(await runCli(totalAssetsOnFork(["--token", token])));
    }

    expect(totals).toEqual(Array(4).fill(expected.toString()));
  });

  it("reads the vault of the given token", async function () {
    const expected = await totalAssets(publicClient, {
      address: sVetBtcAddress,
    });
    expect(expected).toBeGreaterThan(0n);
    expect(expected).not.toBe(
      await totalAssets(publicClient, { address: sVusdAddress }),
    );

    const total = await runCli(totalAssetsOnFork(["--token", vetBtc.symbol]));

    expect(total).toBe(expected.toString());
  });

  it("rejects a token that is not pegged or share", async function () {
    const { exitCode, stderr } = await runCliRaw(
      totalAssetsOnFork(["--token", usdc.symbol]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a pegged or share token: "${usdc.symbol}"`,
    );
  });

  it("rejects a missing --token", async function () {
    const { exitCode, stderr } = await runCliRaw(totalAssetsOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--token <token>'");
  });
});
