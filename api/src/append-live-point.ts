const DAY_MS = 86_400_000;

const sameUtcDay = (a: number, b: number) =>
  Math.floor(a / DAY_MS) === Math.floor(b / DAY_MS);

/**
 * Append a live on-chain reading to a daily subgraph series while keeping at most
 * one point per UTC day. The subgraph writes a history entry once per UTC day, so
 * its latest point can lag the current on-chain value by up to ~24h; the live
 * point keeps the series' last value in sync with the current rate. When the
 * subgraph already has a point for the current UTC day, the live point is not
 * added as a duplicate: it is skipped if its value matches that day's point
 * (keeping the day-aligned subgraph point) or replaces it if the value differs,
 * so the series never has two points on the same day. With no live point (e.g.
 * the on-chain read failed) the history is returned unchanged.
 *
 * Shared by the apy-history, share-value-history and total-deposits-history
 * endpoints so they all append their live point identically.
 */
export function appendLivePoint<T extends { timestamp: number }>({
  getValue,
  history,
  livePoint,
}: {
  getValue: (point: T) => number | string;
  history: T[];
  livePoint: T | null;
}) {
  if (!livePoint) {
    return history;
  }
  const last = history[history.length - 1];
  if (last && sameUtcDay(last.timestamp, livePoint.timestamp)) {
    return getValue(last) === getValue(livePoint)
      ? history
      : [...history.slice(0, -1), livePoint];
  }
  return [...history, livePoint];
}
