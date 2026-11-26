import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getTreasury } from "@vetro-protocol/gateway/actions";
import { getPrice } from "@vetro-protocol/treasury/actions";
import { describe, expect, inject, it } from "vitest";

import { createClients, runCli, runCliRaw, usdc, vusd } from "./helpers.ts";

type Price = {
  latestPrice: string;
  unitPrice: string;
};

describe("swap price", function () {
  const rpcUrl = inject("anvilUrl");

  const priceOnFork = (extra: string[] = []) => [
    "swap",
    "price",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  it("reads the price by symbol", async function () {
    const { publicClient } = createClients(rpcUrl);
    const treasury = await getTreasury(publicClient, {
      address: gatewayAddresses[0],
    });
    const [expectedLatestPrice, expectedUnitPrice] = await getPrice(
      publicClient,
      { address: treasury, token: usdc.address },
    );
    const price = await runCli<Price>(priceOnFork(["--token", usdc.symbol]));
    expect(price.latestPrice).toBe(expectedLatestPrice.toString());
    expect(price.unitPrice).toBe(expectedUnitPrice.toString());
  });

  it("reads the price by address", async function () {
    const { publicClient } = createClients(rpcUrl);
    const treasury = await getTreasury(publicClient, {
      address: gatewayAddresses[0],
    });
    const [expectedLatestPrice, expectedUnitPrice] = await getPrice(
      publicClient,
      { address: treasury, token: usdc.address },
    );
    const price = await runCli<Price>(priceOnFork(["--token", usdc.address]));
    expect(price.latestPrice).toBe(expectedLatestPrice.toString());
    expect(price.unitPrice).toBe(expectedUnitPrice.toString());
  });

  it("rejects a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw(
      priceOnFork(["--token", vusd.symbol]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a whitelisted token: "${vusd.symbol}"`,
    );
  });

  it("rejects a missing --token", async function () {
    const { exitCode, stderr } = await runCliRaw(priceOnFork());
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--token <token>'");
  });
});
