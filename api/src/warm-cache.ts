import * as Sentry from "@sentry/cloudflare";
import type { Context } from "hono";

export type GlobalWarmTask<Data = unknown> = {
  // The cron expression (must match one in wrangler `triggers.crons`)
  cron: string;
  key: () => string;
  produce: (env: Env) => Promise<Data>;
};

export type KeyedWarmTask<Item, Data = unknown> = {
  // The cron expression (must match one in wrangler `triggers.crons`)
  cron: string;
  // The values to warm, one KV entry per item.
  items: readonly Item[];
  key: (item: Item) => string;
  produce: (env: Env, item: Item) => Promise<Data>;
};

/**
 * A cache-warming task: one endpoint's KV values, refreshed on a cron schedule.
 * Either **keyed** — one KV entry per item, `produce(env, item)` and `items`
 * required — or **global** — a single KV entry, `produce(env)` and no `items`.
 * `Data` is the shape `produce` yields; `readWarmedTask` returns it verbatim
 * (declare a task with `satisfies` so `Data` is inferred from `produce`).
 */
type WarmTask<Item = never, Data = unknown> =
  | GlobalWarmTask<Data>
  | KeyedWarmTask<Item, Data>;

/**
 * Identity helpers that define a task while inferring its produced `Data` (and a
 * keyed task's `Item`) from the `produce`/`items` passed. Prefer these over a bare
 * `: GlobalWarmTask` / `satisfies` annotation: the latter gives `produce` a
 * contextual return of `Promise<unknown>`, which `.then(...)` collapses to
 * `unknown` — losing the type `readWarmedTask` would otherwise return.
 */
export const globalWarmTask = <Data>(task: GlobalWarmTask<Data>) => task;
export const keyedWarmTask = <Item, Data>(task: KeyedWarmTask<Item, Data>) =>
  task;

// Warmed values expire after 15 minutes: if the cron stalls (or `produce()` fails)
const cacheTtl = 15 * 60;

/**
 * Read the warmed value for one `item` of a `task` from within a request. On a
 * KV miss (fresh deploy, or an item added before its first cron tick) fall back
 * to computing on demand and write through so the next reader gets a fast hit;
 * the write is backgrounded via `waitUntil` so the caller doesn't block on KV.
 *
 * Overloaded so a keyed task requires `item` and a global task forbids it, and
 * so the return type is the task's produced `Data` (no cast at the call site).
 */
export function readWarmedTask<Data>(args: {
  c: Context<{ Bindings: Env }>;
  task: GlobalWarmTask<Data>;
}): Promise<Data>;
export function readWarmedTask<Item, Data>(args: {
  c: Context<{ Bindings: Env }>;
  item: Item;
  task: KeyedWarmTask<Item, Data>;
}): Promise<Data>;
export async function readWarmedTask<Item = never, Data = unknown>({
  c,
  item,
  task,
}: {
  c: Context<{ Bindings: Env }>;
  item?: Item;
  task: WarmTask<Item, Data>;
}): Promise<Data> {
  const key = "items" in task ? task.key(item as Item) : task.key();
  const kv = c.env.CACHE_KV;
  const cached = await kv.get<Data>(key, "json");
  if (cached !== null) {
    return cached;
  }
  const data =
    "items" in task
      ? await task.produce(c.env, item as Item)
      : await task.produce(c.env);
  // Write through so the next reader gets a fast hit, but never cache empty
  // data and report background write failures — mirroring the cron path.
  if (data !== null && data !== undefined) {
    c.executionCtx.waitUntil(
      kv
        .put(key, JSON.stringify(data), { expirationTtl: cacheTtl })
        .catch((error) => Sentry.captureException(error)),
    );
  }
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
    due.flatMap(function (task) {
      // A keyed task warms one entry per item; a global task warms a single one.
      const entries =
        "items" in task
          ? task.items.map((item) => ({
              key: task.key(item),
              run: () => task.produce(env, item),
            }))
          : [{ key: task.key(), run: () => task.produce(env) }];
      return entries.map(async function ({ key, run }) {
        try {
          const data = await run();
          if (data === null || data === undefined) {
            throw new Error(`Warm task produced no data for ${key}`);
          }
          await kv.put(key, JSON.stringify(data), {
            expirationTtl: cacheTtl,
          });
        } catch (error) {
          Sentry.captureException(error);
        }
      });
    }),
  );
}
