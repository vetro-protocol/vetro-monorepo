import * as Sentry from "@sentry/cloudflare";
import type { Context } from "hono";

/**
 * A cache-warming task: one endpoint's KV values, refreshed on a cron schedule.
 */
export type WarmTask<Item> = {
  // The cron expression (must match one in wrangler `triggers.crons`)
  cron: string;
  items: readonly Item[];
  key: (item: Item) => string;
  produce: (item: Item, env: Env) => Promise<unknown>;
};

// Warmed values expire after 15 minutes: if the cron stalls (or `produce()` fails)
const cacheTtl = 15 * 60;

/**
 * Read the warmed value for one `item` of a `task` from within a request. On a
 * KV miss (fresh deploy, or an item added before its first cron tick) fall back
 * to computing on demand and write through so the next reader gets a fast hit;
 * the write is backgrounded via `waitUntil` so the caller doesn't block on KV.
 */
export async function readWarmedTask<Item>({
  c,
  item,
  task,
}: {
  c: Context<{ Bindings: Env }>;
  item: Item;
  task: WarmTask<Item>;
}) {
  const key = task.key(item);
  const kv = c.env.CACHE_KV;
  const cached = await kv.get(key, "json");
  if (cached !== null) {
    return cached;
  }
  const data = await task.produce(item, c.env);
  c.executionCtx.waitUntil(
    kv.put(key, JSON.stringify(data), { expirationTtl: cacheTtl }),
  );
  return data;
}

/**
 * Warm every item of every task whose cron matches the fired one. Failures are
 * isolated per key: a compute or write error is reported to Sentry and leaves
 * the last-known-good KV value untouched.
 */
export async function warmScheduled({
  cron,
  env,
  kv,
  tasks,
}: {
  cron: string;
  env: Env;
  kv: KVNamespace;
  // Heterogeneous registry: tasks warm different item types (gateways, market
  // ids, ...), so no single element type fits. Each task is self-consistent.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: readonly WarmTask<any>[];
}) {
  const due = tasks.filter((task) => task.cron === cron);
  await Promise.all(
    due.flatMap((task) =>
      task.items.map(async function (item) {
        try {
          const key = task.key(item);
          const data = await task.produce(item, env);
          if (data === null || data === undefined) {
            throw new Error(`Warm task produced no data for ${key}`);
          }
          await kv.put(key, JSON.stringify(data), {
            expirationTtl: cacheTtl,
          });
        } catch (error) {
          Sentry.captureException(error);
        }
      }),
    ),
  );
}
