import type { DexPool } from "@vetro-protocol/core";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { gatewayAddresses } from "@vetro-protocol/gateway";

import {
  getBalanceSheet,
  getStaked,
  getTreasuryComposition,
  getTvl,
} from "./analytics.ts";
import { convertBigIntsToString } from "./convert-bigints-to-string.ts";
import {
  gaugedStrategiesKey,
  getGaugedStrategies,
  getMerklRewards,
} from "./liquidity/incentives.ts";
import { getVenuePools, venues } from "./liquidity/index.ts";
import { getCampaignGauges } from "./liquidity/stake-dao.ts";
import { withTimeout } from "./utils/promises.ts";
import { getApyForVault } from "./variable-stake.ts";
import { globalWarmTask, keyedWarmTask } from "./warm-cache.ts";

// Warms `GET /analytics/treasury/:gatewayAddress`
export const treasuryTask = keyedWarmTask({
  cron: "*/5 * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) => `analytics:treasury:${gatewayAddress}`,
  produce: (env, gatewayAddress) =>
    getTreasuryComposition({
      gatewayAddress,
      kv: env.CACHE_KV,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
});

// Warms `GET /analytics/balance-sheet/:gatewayAddress`
export const balanceSheetTask = keyedWarmTask({
  cron: "*/5 * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) => `analytics:balance-sheet:${gatewayAddress}`,
  produce: (env, gatewayAddress) =>
    getBalanceSheet({
      gatewayAddress,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
});

// Warms `GET /analytics/tvl/:gatewayAddress`
export const tvlTask = keyedWarmTask({
  cron: "* * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) => `analytics:tvl:${gatewayAddress}`,
  produce: (env, gatewayAddress) =>
    getTvl({
      gatewayAddress,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
});

// Warms `GET /analytics/staked/:gatewayAddress`
export const stakedTask = keyedWarmTask({
  cron: "* * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) => `analytics:staked:${gatewayAddress}`,
  produce: (env, gatewayAddress) =>
    getStaked({
      gatewayAddress,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
});

// Warms one value per staking vault for GET /variable-stake/apy,
// /analytics/net-revenue/:gatewayAddress and the APY history live point.
export const apyTask = keyedWarmTask({
  cron: "* * * * *",
  items: stakingVaultAddresses,
  key: (stakingVaultAddress) =>
    `variable-stake:apy:${stakingVaultAddress.toLowerCase()}`,
  produce: (env, stakingVaultAddress) =>
    getApyForVault({
      rpcUrl: env.CUSTOM_RPC_URL_MAINNET,
      vaultAddress: stakingVaultAddress,
    }),
});

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const liquidityVenuePoolsTask = keyedWarmTask({
  cron: "*/5 * * * *",
  items: venues,
  key: (venue) => `liquidity:pools:${venue}`,
  produce: (env, venue) =>
    withTimeout(
      getVenuePools({
        nowSeconds: nowSeconds(),
        portalApiUrl: env.PORTAL_API_URL,
        rpcUrl: env.CUSTOM_RPC_URL_MAINNET,
        subgraphApiKey: env.SUBGRAPH_API_KEY,
        venue,
      }),
    ),
});

export const liquidityCampaignGaugesTask = globalWarmTask({
  cron: "*/5 * * * *",
  key: () => "liquidity:campaign-gauges",
  produce: () => withTimeout(getCampaignGauges(nowSeconds())),
});

export const liquidityMerklRewardsTask = globalWarmTask({
  cron: "*/5 * * * *",
  key: () => "liquidity:merkl-rewards",
  async produce(env) {
    const cached = await Promise.all(
      venues.map((venue) =>
        env.CACHE_KV.get<DexPool[]>(liquidityVenuePoolsTask.key(venue), "json"),
      ),
    );
    const pools = cached.filter((venuePools) => venuePools !== null).flat();
    if (pools.length === 0) {
      throw new Error("No cached DEX pools to read Merkl rewards for");
    }
    return withTimeout(getMerklRewards({ nowSeconds: nowSeconds(), pools }));
  },
});

export const liquidityStrategiesTask = globalWarmTask({
  cron: "*/5 * * * *",
  key: () => gaugedStrategiesKey,
  async produce(env) {
    const pools = await env.CACHE_KV.get<DexPool[]>(
      liquidityVenuePoolsTask.key("curve"),
      "json",
    );
    if (pools === null) {
      throw new Error("No cached Curve pools to read StakeDAO strategies for");
    }
    return withTimeout(getGaugedStrategies({ pools }));
  },
});

export const warmTasks = [
  treasuryTask,
  balanceSheetTask,
  tvlTask,
  stakedTask,
  apyTask,
  liquidityVenuePoolsTask,
  liquidityCampaignGaugesTask,
  liquidityMerklRewardsTask,
  liquidityStrategiesTask,
];
