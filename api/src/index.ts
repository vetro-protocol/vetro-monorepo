import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/earn";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";
import type { Address } from "viem";

import * as analytics from "./analytics.ts";
import * as borrow from "./borrow.ts";
import { convertBigIntsToString } from "./convert-bigints-to-string.ts";
import { getSubgraphUrl } from "./env.ts";
import {
  validateAddress,
  validateGatewayAddress,
  validateParam,
  validateStakingVaultAddress,
} from "./param-validators.ts";
import { securityHeaders } from "./security-headers.ts";
import {
  getShareValueHistory,
  validPeriods as shareValueHistoryValidPeriods,
} from "./share-value-history.ts";
import { createOriginFn, parseOrigins } from "./validate-origin.ts";
import * as variableStake from "./variable-stake.ts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async function (c, next) {
  const origins = parseOrigins(c.env.ORIGINS!);
  const originFn = createOriginFn(origins);
  return cors({ origin: originFn })(c, next);
});

app.use("*", securityHeaders);

app.get(
  "/analytics/pegged-token-backing/:gatewayAddress",
  validateGatewayAddress,
  cache({
    cacheControl: "max-age=15, stale-while-revalidate=45",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const url = c.env.CUSTOM_RPC_URL_MAINNET;
      const gatewayAddress = c.get("gatewayAddress");
      const data = await analytics.getPeggedTokenBacking({
        gatewayAddress,
        url,
      });
      return c.json(convertBigIntsToString(data));
    } catch (error) {
      throw new Error(`Failed to get pegged token backing: ${error.message}`);
    }
  },
);

app.get(
  "/analytics/treasury/:gatewayAddress",
  validateGatewayAddress,
  cache({
    cacheControl: "max-age=15, stale-while-revalidate=45",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const url = c.env.CUSTOM_RPC_URL_MAINNET;
      const gatewayAddress = c.get("gatewayAddress");
      const data = await analytics.getTreasuryComposition({
        gatewayAddress,
        url,
      });
      return c.json(convertBigIntsToString(data));
    } catch (error) {
      throw new Error(`Failed to get treasury composition: ${error.message}`);
    }
  },
);

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
  "/borrow/:marketId/collateral-assets",
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
  cache({
    cacheControl: "max-age=3600",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const marketId = c.req.param("marketId").toLowerCase();
      const collateralAssets = await borrow.getCollateralAssets({ marketId });
      return c.json(collateralAssets);
    } catch (error) {
      throw new Error(`Failed to get collateral assets: ${error.message}`);
    }
  },
);

app.get(
  "/variable-stake/cost-basis/:address",
  validateAddress,
  cache({
    cacheControl: "max-age=300",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const address = c.req.param("address") as `0x${string}`;
      const url = getSubgraphUrl(c.env);
      const data = await variableStake.getCostBasis({
        address,
        url,
      });
      return c.json(convertBigIntsToString(data));
    } catch (error) {
      throw new Error(`Failed to get cost basis: ${error.message}`);
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
      const vaultOpportunities: Record<Address, string | undefined> = {
        [sVetBtcAddress]: c.env.MERKL_OPPORTUNITY_SVETBTC,
        [sVusdAddress]: c.env.MERKL_OPPORTUNITY_SVUSD,
      };
      const data = await variableStake.getUserRewards({
        address,
        vaultOpportunities,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get user rewards: ${error.message}`);
    }
  },
);

app.get(
  "/variable-stake/exit-queue/:gatewayAddress",
  validateGatewayAddress,
  cache({
    cacheControl: "max-age=300",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const gatewayAddress = c.get("gatewayAddress");
      const rpcUrl = c.env.CUSTOM_RPC_URL_MAINNET;
      const subgraphUrl = getSubgraphUrl(c.env);
      const data = await variableStake.getExitTicketQueueSize({
        gatewayAddress,
        rpcUrl,
        subgraphUrl,
      });
      return c.json(convertBigIntsToString(data));
    } catch (error) {
      console.log(error.stack);
      throw new Error(`Failed to get exit queue data: ${error.message}`);
    }
  },
);

app.get(
  "/variable-stake/share-value-history/:stakingVaultAddress/:period",
  validateStakingVaultAddress,
  validateParam("period", shareValueHistoryValidPeriods),
  cache({
    cacheControl: "max-age=3600",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const stakingVaultAddress = c.get("stakingVaultAddress");
      const url = getSubgraphUrl(c.env);
      const period = c.req.param("period");
      const data = await getShareValueHistory({
        period,
        stakingVaultAddress,
        url,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get share value history: ${error.message}`);
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
