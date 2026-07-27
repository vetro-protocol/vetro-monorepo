import { describe, expect, it } from "vitest";

import {
  type CooldownRequest,
  keeperBehindThresholdSeconds,
  summarizeCooldown,
} from "./cooldownSummary";

const nowSeconds = 1_784_000_000;

const request = ({
  assets = 1000n,
  claimableAt,
  requestId = 1n,
}: {
  assets?: bigint;
  claimableAt: number;
  requestId?: bigint;
}): CooldownRequest => ({
  assets,
  claimableAt: BigInt(claimableAt),
  requestId,
});

describe("summarizeCooldown", function () {
  it("returns empty buckets and no signal without requests", function () {
    const summary = summarizeCooldown({ nowSeconds, requests: [] });
    expect(summary.inCooldown).toEqual({ assets: 0n, count: 0 });
    expect(summary.ready).toEqual({ assets: 0n, count: 0 });
    expect(summary.oldestReadySeconds).toBeUndefined();
    expect(summary.isKeeperBehind).toBe(false);
  });

  it("puts future requests in cooldown and stays clear", function () {
    const summary = summarizeCooldown({
      nowSeconds,
      requests: [
        request({ assets: 100n, claimableAt: nowSeconds + 10 }),
        request({ assets: 200n, claimableAt: nowSeconds + 86400 }),
      ],
    });
    expect(summary.inCooldown).toEqual({ assets: 300n, count: 2 });
    expect(summary.ready).toEqual({ assets: 0n, count: 0 });
    expect(summary.oldestReadySeconds).toBeUndefined();
    expect(summary.isKeeperBehind).toBe(false);
  });

  it("splits mixed requests and sums assets per bucket", function () {
    const summary = summarizeCooldown({
      nowSeconds,
      requests: [
        request({ assets: 100n, claimableAt: nowSeconds - 30 }),
        request({ assets: 200n, claimableAt: nowSeconds + 30 }),
        request({ assets: 400n, claimableAt: nowSeconds - 10 }),
      ],
    });
    expect(summary.inCooldown).toEqual({ assets: 200n, count: 1 });
    expect(summary.ready).toEqual({ assets: 500n, count: 2 });
  });

  it("counts a request maturing exactly now as ready", function () {
    const summary = summarizeCooldown({
      nowSeconds,
      requests: [request({ claimableAt: nowSeconds })],
    });
    expect(summary.ready.count).toBe(1);
    expect(summary.oldestReadySeconds).toBe(0);
  });

  it("measures the oldest ready request, not the newest", function () {
    const summary = summarizeCooldown({
      nowSeconds,
      requests: [
        request({ claimableAt: nowSeconds - 60 }),
        request({ claimableAt: nowSeconds - 7200 }),
        request({ claimableAt: nowSeconds - 600 }),
      ],
    });
    expect(summary.oldestReadySeconds).toBe(7200);
  });

  it("stays clear at exactly the threshold", function () {
    const summary = summarizeCooldown({
      nowSeconds,
      requests: [
        request({ claimableAt: nowSeconds - keeperBehindThresholdSeconds }),
      ],
    });
    expect(summary.isKeeperBehind).toBe(false);
  });

  it("flags the keeper behind past the threshold", function () {
    const summary = summarizeCooldown({
      nowSeconds,
      requests: [
        request({ claimableAt: nowSeconds - keeperBehindThresholdSeconds - 1 }),
      ],
    });
    expect(summary.isKeeperBehind).toBe(true);
  });
});
