import { sVusdAddress } from "@vetro-protocol/earn";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import {
  validateGatewayAddress,
  validateStakingVaultAddress,
} from "../src/param-validators.ts";

const buildStakingVaultApp = function () {
  const app = new Hono();
  app.get("/test/:stakingVaultAddress", validateStakingVaultAddress, (c) =>
    c.json({ stakingVaultAddress: c.get("stakingVaultAddress") }),
  );
  return app;
};

const buildGatewayApp = function () {
  const app = new Hono();
  app.get("/test/:gatewayAddress", validateGatewayAddress, (c) =>
    c.json({ gatewayAddress: c.get("gatewayAddress") }),
  );
  return app;
};

describe("validateStakingVaultAddress", function () {
  it("returns 400 with a Malformed error for a non-address parameter", async function () {
    const app = buildStakingVaultApp();

    const response = await app.request("/test/0xdeadbeef");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Malformed Staking Vault Address",
    });
  });

  it("returns 404 for a well-formed address that is not a known staking vault", async function () {
    const app = buildStakingVaultApp();

    const response = await app.request(
      "/test/0x0000000000000000000000000000000000000001",
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Staking vault not found" });
  });

  it("passes through and stores the checksummed address for a known staking vault", async function () {
    const app = buildStakingVaultApp();

    const response = await app.request(`/test/${sVusdAddress.toLowerCase()}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      stakingVaultAddress: sVusdAddress,
    });
  });
});

describe("validateGatewayAddress", function () {
  it("returns 400 with a Malformed error for a non-address parameter", async function () {
    const app = buildGatewayApp();

    const response = await app.request("/test/0xdeadbeef");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Malformed Gateway Address",
    });
  });

  it("returns 404 for a well-formed address that is not a known gateway", async function () {
    const app = buildGatewayApp();

    const response = await app.request(
      "/test/0x0000000000000000000000000000000000000001",
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Gateway not found" });
  });

  it("passes through and stores the checksummed address for a known gateway", async function () {
    const app = buildGatewayApp();
    const known = gatewayAddresses[0];

    const response = await app.request(`/test/${known.toLowerCase()}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ gatewayAddress: known });
  });
});
