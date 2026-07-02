import * as Sentry from "@sentry/cloudflare";
import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";

import {
  readWarmedTask,
  type WarmTask,
  warmScheduled,
} from "../src/warm-cache.ts";

vi.mock("@sentry/cloudflare", () => ({
  captureException: vi.fn(),
}));

// A minimal in-memory KV that records writes and lets tests force put failures.
function createFakeKv({
  putError,
  store = {},
}: {
  putError?: Error;
  store?: Record<string, unknown>;
} = {}) {
  const puts: { key: string; value: string }[] = [];
  return {
    get: vi.fn(async (key: string) => (key in store ? store[key] : null)),
    put: vi.fn(async function (key: string, value: string) {
      if (putError) {
        throw putError;
      }
      puts.push({ key, value });
    }),
    puts,
  };
}

// A fake Hono context that runs `waitUntil` work so tests can await writes.
function createFakeContext(kv: unknown) {
  const pending: Promise<unknown>[] = [];
  const c = {
    env: { CACHE_KV: kv },
    executionCtx: {
      waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    },
  } as unknown as Context<{ Bindings: Env }>;
  return {
    c,
    settled: () => Promise.all(pending),
  };
}

const task: WarmTask<string> = {
  cron: "* * * * *",
  items: ["a", "b"],
  key: (item) => `key:${item}`,
  produce: vi.fn(),
};

describe("warm-cache/readWarmedTask", function () {
  it("returns the cached value without producing on a hit", async function () {
    const kv = createFakeKv({ store: { "key:a": { cached: true } } });
    const { c } = createFakeContext(kv);

    const data = await readWarmedTask({ c, item: "a", task });

    expect(data).toEqual({ cached: true });
    expect(task.produce).not.toHaveBeenCalled();
    expect(kv.put).not.toHaveBeenCalled();
  });

  it("produces, returns and writes through on a miss", async function () {
    const kv = createFakeKv();
    vi.mocked(task.produce).mockResolvedValue({ fresh: true });
    const { c, settled } = createFakeContext(kv);

    const data = await readWarmedTask({ c, item: "a", task });
    await settled();

    expect(data).toEqual({ fresh: true });
    expect(task.produce).toHaveBeenCalledWith("a", c.env);
    expect(kv.puts).toEqual([
      { key: "key:a", value: JSON.stringify({ fresh: true }) },
    ]);
  });

  it("returns empty data on a miss but does not cache it", async function () {
    const kv = createFakeKv();
    vi.mocked(task.produce).mockResolvedValue(undefined);
    const { c, settled } = createFakeContext(kv);

    const data = await readWarmedTask({ c, item: "a", task });
    await settled();

    expect(data).toBeUndefined();
    expect(kv.put).not.toHaveBeenCalled();
  });

  it("reports a background write failure to Sentry", async function () {
    const putError = new Error("kv down");
    const kv = createFakeKv({ putError });
    vi.mocked(task.produce).mockResolvedValue({ fresh: true });
    const { c, settled } = createFakeContext(kv);

    const data = await readWarmedTask({ c, item: "a", task });
    await settled();

    expect(data).toEqual({ fresh: true });
    expect(Sentry.captureException).toHaveBeenCalledWith(putError);
  });
});

describe("warm-cache/warmScheduled", function () {
  it("only warms tasks whose cron matches the fired one", async function () {
    const kv = createFakeKv();
    const other: WarmTask<string> = {
      cron: "*/5 * * * *",
      items: ["z"],
      key: (item) => `other:${item}`,
      produce: vi.fn().mockResolvedValue({ v: 1 }),
    };
    vi.mocked(task.produce).mockResolvedValue({ v: 1 });

    await warmScheduled({
      cron: "* * * * *",
      env: {} as Env,
      kv: kv as unknown as KVNamespace,
      tasks: [task, other],
    });

    expect(other.produce).not.toHaveBeenCalled();
    expect(kv.puts.map((p) => p.key)).toEqual(["key:a", "key:b"]);
  });

  it("isolates per-key failures and reports them to Sentry", async function () {
    const kv = createFakeKv();
    vi.mocked(task.produce).mockImplementation(async function (item) {
      if (item === "a") {
        throw new Error("produce a failed");
      }
      return { item };
    });

    await warmScheduled({
      cron: "* * * * *",
      env: {} as Env,
      kv: kv as unknown as KVNamespace,
      tasks: [task],
    });

    // The failing item is skipped; the healthy one is still warmed.
    expect(kv.puts).toEqual([
      { key: "key:b", value: JSON.stringify({ item: "b" }) },
    ]);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("treats empty produced data as a failure and leaves KV untouched", async function () {
    const kv = createFakeKv();
    vi.mocked(task.produce).mockResolvedValue(null);

    await warmScheduled({
      cron: "* * * * *",
      env: {} as Env,
      kv: kv as unknown as KVNamespace,
      tasks: [{ ...task, items: ["a"] }],
    });

    expect(kv.put).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
