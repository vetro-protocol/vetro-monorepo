import * as Sentry from "@sentry/cloudflare";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/earn";
import { type Context, Hono, type Next } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";
import type { Address } from "viem";

import { getApyHistory } from "./apy-history.ts";
import * as borrow from "./borrow.ts";
import {
  contactFeatureToggle,
  sendContactConfirmation,
  sendContactEmail,
  validateContactForm,
  verifyTurnstile,
} from "./contact.ts";
import { convertBigIntsToString } from "./convert-bigints-to-string.ts";
import { getSubgraphUrl } from "./env.ts";
import {
  validateAddress,
  validateGatewayAddress,
  validateParam,
  validateStakingVaultAddress,
} from "./param-validators.ts";
import { securityHeaders } from "./security-headers.ts";
import { getShareValueHistory } from "./share-value-history.ts";
import { getTotalDepositsHistory } from "./total-deposits-history.ts";
import { createOriginFn, parseOrigins } from "./validate-origin.ts";
import * as variableStake from "./variable-stake.ts";
import { validPeriods as vaultHistoryValidPeriods } from "./vault-history-period.ts";
import { readWarmedTask, warmScheduled } from "./warm-cache.ts";
import {
  apyTask,
  collateralizationRatioTask,
  stakedTask,
  treasuryTask,
  tvlTask,
  warmTasks,
} from "./warm-tasks.ts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async function (c, next) {
  const origins = parseOrigins(c.env.ORIGINS!);
  const originFn = createOriginFn(origins);
  return cors({ origin: originFn })(c, next);
});

app.use("*", securityHeaders);

app.get(
  "/analytics/collateralization-ratio/:gatewayAddress",
  validateGatewayAddress,
  cache({
    cacheControl: "max-age=60",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const gatewayAddress = c.get("gatewayAddress");
      const data = await readWarmedTask({
        c,
        item: gatewayAddress,
        task: collateralizationRatioTask,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(
        `Failed to get collateralization ratio: ${error.message}`,
      );
    }
  },
);

app.get(
  "/analytics/tvl/:gatewayAddress",
  validateGatewayAddress,
  cache({
    cacheControl: "max-age=60",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const gatewayAddress = c.get("gatewayAddress");
      const data = await readWarmedTask({
        c,
        item: gatewayAddress,
        task: tvlTask,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get TVL: ${error.message}`);
    }
  },
);

app.get(
  "/analytics/staked/:gatewayAddress",
  validateGatewayAddress,
  cache({
    cacheControl: "max-age=60",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const gatewayAddress = c.get("gatewayAddress");
      const data = await readWarmedTask({
        c,
        item: gatewayAddress,
        task: stakedTask,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get staked total: ${error.message}`);
    }
  },
);

app.get(
  "/analytics/treasury/:gatewayAddress",
  validateGatewayAddress,
  cache({
    cacheControl: "max-age=60",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const gatewayAddress = c.get("gatewayAddress");
      const data = await readWarmedTask({
        c,
        item: gatewayAddress,
        task: treasuryTask,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get treasury composition: ${error.message}`);
    }
  },
);

// Cheap, local check on the market id shape. Kept ahead of `cache()` so
// malformed ids are rejected without a cache lookup or a network call.
function validateMarketIdFormat(c: Context, next: Next) {
  const marketId = c.req.param("marketId")?.toLowerCase();
  if (!marketId || !/^0x[a-f0-9]{64}$/.test(marketId)) {
    return c.json({ error: "Malformed market id" }, 400);
  }
  return next();
}

// Expensive check: confirms the market exists and is supported via a Morpho
// API call. Placed *after* `cache()` so it only runs on a cache miss, not on
// every cached request.
async function validateMarketIdSupported(c: Context, next: Next) {
  try {
    const marketId = c.req.param("marketId")?.toLowerCase();
    if (!marketId) {
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
}

app.get(
  "/borrow/:marketId/apr-history/:period",
  validateMarketIdFormat,
  validateParam("period", borrow.validPeriods),
  cache({
    cacheControl: "max-age=3600",
    cacheName: "vetro-api",
  }),
  validateMarketIdSupported,
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
  validateMarketIdFormat,
  cache({
    cacheControl: "max-age=300",
    cacheName: "vetro-api",
  }),
  validateMarketIdSupported,
  async function (c) {
    try {
      const marketId = c.req.param("marketId").toLowerCase();
      const collateralAssets = await borrow.getCollateralAssets(marketId);
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
    cacheControl: "max-age=60",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const data = await readWarmedTask({ c, task: apyTask });
      return c.json(data ?? {});
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
  validateParam("period", vaultHistoryValidPeriods),
  cache({
    cacheControl: "max-age=300",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const stakingVaultAddress = c.get("stakingVaultAddress");
      const url = getSubgraphUrl(c.env);
      const period = c.req.param("period");
      const data = await getShareValueHistory({
        period,
        rpcUrl: c.env.CUSTOM_RPC_URL_MAINNET,
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
  "/variable-stake/apy-history/:stakingVaultAddress/:period",
  validateStakingVaultAddress,
  validateParam("period", vaultHistoryValidPeriods),
  cache({
    cacheControl: "max-age=300",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const stakingVaultAddress = c.get("stakingVaultAddress");
      const url = getSubgraphUrl(c.env);
      const period = c.req.param("period");
      const data = await getApyHistory({
        c,
        period,
        stakingVaultAddress,
        url,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get APY history: ${error.message}`);
    }
  },
);

app.get(
  "/variable-stake/total-deposits-history/:stakingVaultAddress/:period",
  validateStakingVaultAddress,
  validateParam("period", vaultHistoryValidPeriods),
  cache({
    cacheControl: "max-age=300",
    cacheName: "vetro-api",
  }),
  async function (c) {
    try {
      const stakingVaultAddress = c.get("stakingVaultAddress");
      const url = getSubgraphUrl(c.env);
      const period = c.req.param("period");
      const data = await getTotalDepositsHistory({
        period,
        rpcUrl: c.env.CUSTOM_RPC_URL_MAINNET,
        stakingVaultAddress,
        url,
      });
      return c.json(data);
    } catch (error) {
      throw new Error(`Failed to get total deposits history: ${error.message}`);
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

app.post(
  "/contact",
  contactFeatureToggle,
  validateContactForm,
  verifyTurnstile,
  async function (c) {
    const { category, email, message } = c.get("contactForm");
    await sendContactEmail({ category, email, env: c.env, message });
    // The confirmation to the submitter is best-effort: a failure here must not
    // fail the request, since the support notification already went out.
    try {
      await sendContactConfirmation({ category, email, env: c.env });
    } catch (error) {
      Sentry.captureException(error);
    }
    return c.body(null, 204);
  },
);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError(function (error, c) {
  Sentry.captureException(error);
  console.error("Internal Server Error:", error.message);
  return c.json({ error: "Internal Server Error" }, 500);
});

const handler = Object.assign(app, {
  async scheduled(event: ScheduledController, env: Env) {
    await warmScheduled({
      cron: event.cron,
      env,
      kv: env.CACHE_KV,
      tasks: warmTasks,
    });
  },
}) satisfies ExportedHandler<Env>;

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    enableLogs: true,
    environment: "production",
  }),
  handler,
);
