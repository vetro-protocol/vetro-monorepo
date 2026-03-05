import { Hono } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";

import * as borrow from "./borrow.ts";
import { getSubgraphUrl } from "./env.ts";
import { validateAddress, validateParam } from "./param-validators.ts";
import { createOriginFn, parseOrigins } from "./validate-origin.ts";
import * as variableStake from "./variable-stake.ts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async function (c, next) {
  const origins = parseOrigins(c.env.ORIGINS!);
  const originFn = createOriginFn(origins);
  return cors({ origin: originFn })(c, next);
});

app.get(
  "/borrow/:marketId/apr-history/:period",
  async function (c, next) {
    try {
      const marketId = c.req.param("marketId").toLowerCase();
      if (!/^0x[a-f0-9]{64}$/.test(marketId)) {
        return c.json({ error: "Malformed market id" }, 400);
      }
      const isValid = await borrow.validateMarketId({ marketId });
      if (!isValid) {
        return c.json({ error: "Unsupported market" }, 404);
      }
      return next();
    } catch (error) {
      return c.json({ error: `Invalid market id: ${error.message}` }, 404);
    }
  },
  validateParam("period", borrow.validPeriods),
  cache({
    cacheControl: "max-age=3600",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const marketId = c.req.param("marketId").toLowerCase();
      const period = c.req.param("period");
      const data = await borrow.getAprHistory({ marketId, period });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get APR history: ${error.message}`);
    }
  },
);

app.get(
  "/variable-stake/apy",
  cache({
    cacheControl: "max-age=3600",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const url = getSubgraphUrl(c.env);
      const data = await variableStake.getApy({ url });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get APY: ${error.message}`);
    }
  },
);

app.get(
  "/variable-stake/rewards/:address",
  validateAddress,
  cache({
    cacheControl: "max-age=15, stale-while-revalidate=45",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const address = c.req.param("address") as `0x${string}`;
      const opportunityId = c.env.MERKL_OPPORTUNITY_ID;
      const data = await variableStake.getUserRewards({
        address,
        opportunityId,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get user rewards: ${error.message}`);
    }
  },
);

app.get(
  "/variable-stake/exit-tickets/:address",
  validateAddress,
  cache({
    cacheControl: "max-age=15, stale-while-revalidate=45",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const address = c.req.param("address") as `0x${string}`;
      const url = getSubgraphUrl(c.env);
      const data = await variableStake.getUserExitTickets({ address, url });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get exit tickets: ${error.message}`);
    }
  },
);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError(function (error, c) {
  console.error("Internal Server Error:", error.message);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
