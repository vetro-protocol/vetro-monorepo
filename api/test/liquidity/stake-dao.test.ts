import type { DexPool } from "@vetro-protocol/core";
import fetchJson from "tiny-fetch-json";
import { describe, expect, it, vi } from "vitest";

import {
  type StakeDaoStrategy,
  strategyRewardsApr,
} from "../../src/liquidity/stake-dao.ts";
import { warmScheduled } from "../../src/warm-cache.ts";
import {
  liquidityStrategiesTask,
  liquidityVenuePoolsTask,
} from "../../src/warm-tasks.ts";
import { createFakeKv } from "../utils/fake-kv.ts";

vi.mock("tiny-fetch-json", () => ({ default: vi.fn() }));
vi.mock("@sentry/cloudflare", () => ({ captureException: vi.fn() }));

const strategy: StakeDaoStrategy = {
  apr: { current: { total: 3 } },
  chainId: 1,
  gaugeAddress: "0x1111111111111111111111111111111111111111",
  key: "strategy",
  lpToken: { address: "0x2222222222222222222222222222222222222222" },
  rewards: [],
  tradingApy: 0.25,
};

const pool: DexPool = {
  address: "0x3333333333333333333333333333333333333333",
  apr: 1,
  chainId: 1,
  coins: [],
  dex: "curve",
  dexMetadata: {
    gaugeAddress: "0x1111111111111111111111111111111111111111",
    poolId: "tracked-pool",
  },
  rewards: [],
  tvlUsd: 1000,
  volumeUsd24h: 10,
};

describe("liquidity/strategyRewardsApr", function () {
  it("rejects a null total APR and keeps the warm task's last good value", async function () {
    const invalidStrategy = { ...strategy, apr: { current: { total: null } } };
    expect(() => strategyRewardsApr(invalidStrategy)).toThrow(
      "StakeDAO returned a missing or non-finite total APR",
    );
    const key = liquidityStrategiesTask.key();
    const kv = createFakeKv({
      store: {
        [key]: [strategy],
        [liquidityVenuePoolsTask.key("curve")]: [pool],
      },
    });
    vi.mocked(fetchJson).mockResolvedValue([invalidStrategy]);
    await warmScheduled({
      cron: liquidityStrategiesTask.cron,
      env: { CACHE_KV: kv.kv } as Env,
      kv: kv.kv,
      tasks: [liquidityStrategiesTask],
    });
    expect(kv.put).not.toHaveBeenCalled();
    expect(await kv.get(key)).toEqual([strategy]);
  });

  it("warms only matching strategies without failing on another pool's invalid APR", async function () {
    const unrelatedStrategy: StakeDaoStrategy = {
      ...strategy,
      apr: { current: { total: null } },
      gaugeAddress: "0x4444444444444444444444444444444444444444",
      key: "unrelated",
    };
    const key = liquidityStrategiesTask.key();
    const kv = createFakeKv({
      store: { [liquidityVenuePoolsTask.key("curve")]: [pool] },
    });
    vi.mocked(fetchJson).mockResolvedValue([strategy, unrelatedStrategy]);
    await warmScheduled({
      cron: liquidityStrategiesTask.cron,
      env: { CACHE_KV: kv.kv } as Env,
      kv: kv.kv,
      tasks: [liquidityStrategiesTask],
    });
    expect(kv.puts).toEqual([{ key, value: JSON.stringify([strategy]) }]);
    expect(await kv.get(key)).toEqual([strategy]);
  });

  it("keeps cached strategies when the Curve pool cache is missing", async function () {
    const key = liquidityStrategiesTask.key();
    const kv = createFakeKv({ store: { [key]: [strategy] } });
    await warmScheduled({
      cron: liquidityStrategiesTask.cron,
      env: { CACHE_KV: kv.kv } as Env,
      kv: kv.kv,
      tasks: [liquidityStrategiesTask],
    });
    expect(kv.put).not.toHaveBeenCalled();
    expect(await kv.get(key)).toEqual([strategy]);
  });
});
