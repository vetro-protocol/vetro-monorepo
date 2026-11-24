import fetchJson from "tiny-fetch-json";
import { describe, expect, it, vi } from "vitest";

import {
  type StakeDaoStrategy,
  strategyRewardsApr,
} from "../../src/liquidity/stake-dao.ts";
import { warmScheduled } from "../../src/warm-cache.ts";
import { liquidityStrategiesTask } from "../../src/warm-tasks.ts";
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

describe("liquidity/strategyRewardsApr", function () {
  it("rejects a null total APR and keeps the warm task's last good value", async function () {
    const invalidStrategy = { ...strategy, apr: { current: { total: null } } };
    expect(() => strategyRewardsApr(invalidStrategy)).toThrow(
      "StakeDAO returned a missing or non-finite total APR",
    );
    const key = liquidityStrategiesTask.key();
    const kv = createFakeKv({ store: { [key]: [strategy] } });
    vi.mocked(fetchJson).mockResolvedValue([invalidStrategy]);
    await warmScheduled({
      cron: liquidityStrategiesTask.cron,
      env: {} as Env,
      kv: kv.kv,
      tasks: [liquidityStrategiesTask],
    });
    expect(kv.put).not.toHaveBeenCalled();
    expect(await kv.get(key)).toEqual([strategy]);
  });
});
