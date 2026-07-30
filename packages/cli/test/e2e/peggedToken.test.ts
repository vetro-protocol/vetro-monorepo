import { gatewayAddresses } from "@vetro-protocol/gateway";
import { type Address, getAddress } from "viem";
import { symbol } from "viem-erc20/actions";
import { describe, expect, inject, it } from "vitest";

import { createClients, runCli, runCliRaw, usdc } from "./helpers.js";

describe("swap pegged-token", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient } = createClients(rpcUrl);

  it.for(gatewayAddresses)(
    "prints the pegged token of gateway %s",
    async function (gateway) {
      const peggedToken = await runCli<Address>({
        args: ["swap", "pegged-token", "--gateway", gateway],
        rpcUrl,
      });

      expect(getAddress(peggedToken)).toBe(peggedToken);
      expect(
        await symbol(publicClient, { address: peggedToken }),
      ).not.toHaveLength(0);
    },
  );

  it("accepts a non-checksummed gateway address", async function () {
    const [gateway] = gatewayAddresses;
    const peggedToken = await runCli<Address>({
      args: ["swap", "pegged-token", "--gateway", gateway.toLowerCase()],
      rpcUrl,
    });
    expect(getAddress(peggedToken)).toBe(peggedToken);
  });

  it("rejects an address that is not an enabled gateway", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: ["swap", "pegged-token", "--gateway", usdc.address],
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`Not an enabled gateway: "${usdc.address}"`);
  });

  it("rejects an invalid gateway address", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: ["swap", "pegged-token", "--gateway", "notanaddress"],
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a missing --gateway", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: ["swap", "pegged-token"],
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--gateway <addr>'");
  });
});
