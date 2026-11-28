import { vi } from "vitest";

export function createFakeKv({
  getError,
  putError,
  store = {},
}: {
  getError?: Error;
  putError?: Error;
  store?: Record<string, unknown>;
} = {}) {
  const values = new Map(Object.entries(store));
  const puts: { key: string; value: string }[] = [];
  const get = vi.fn(async function (key: string) {
    if (getError) {
      throw getError;
    }
    return values.get(key) ?? null;
  });
  const put = vi.fn(async function (key: string, value: string) {
    if (putError) {
      throw putError;
    }
    puts.push({ key, value });
    values.set(key, JSON.parse(value) as unknown);
  });
  return {
    get,
    kv: { get, put } as unknown as KVNamespace,
    put,
    puts,
  };
}
