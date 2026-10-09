import { useEffect, useState } from "react";
import { unixNowTimestamp } from "utils/date";

/**
 * Schedules a re-render the moment the soonest future timestamp in `items`
 * arrives, so notifications can flip from "pending" to "ready" without
 * polling or waiting for the next data refetch.
 *
 * `getFutureTimestamp` returns the unix-second timestamp for an item, or
 * `undefined` to skip it (e.g. already-resolved items). Items whose
 * timestamp is already in the past are skipped automatically.
 *
 * Returns the current unix-second clock; safe to ignore when the caller
 * already filters by some other predicate (e.g. a status helper that reads
 * `Date.now()` itself) — calling the hook is enough to keep the UI live.
 */
export function useNowTickingPast<T>(
  items: T[] | undefined,
  getFutureTimestamp: (item: T) => number | undefined,
): number {
  const [now, setNow] = useState(unixNowTimestamp);

  const next = items?.reduce<number | undefined>(function findNext(
    nearest,
    item,
  ) {
    const ts = getFutureTimestamp(item);
    if (ts === undefined || ts <= now) {
      return nearest;
    }
    if (nearest === undefined || ts < nearest) {
      return ts;
    }
    return nearest;
  }, undefined);

  useEffect(
    function scheduleNextTick() {
      if (next === undefined) {
        return undefined;
      }
      const delay = Math.max(0, (next - unixNowTimestamp()) * 1000);
      const timer = setTimeout(function tick() {
        setNow(unixNowTimestamp());
      }, delay);

      return () => clearTimeout(timer);
    },
    [next],
  );

  return now;
}
