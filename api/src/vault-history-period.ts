const secsPerDay = 86400;

/* eslint-disable sort-keys */
const periodToStartOffset: Record<string, number> = {
  "1w": 7 * secsPerDay,
  "1m": 30 * secsPerDay,
  "3m": 90 * secsPerDay,
  "1y": 366 * secsPerDay,
};
/* eslint-enable sort-keys */

export const validPeriods = Object.keys(periodToStartOffset);

/**
 * Return the UTC-day-floored start timestamp (in seconds, as a string for the
 * subgraph's BigInt filters) for the given period window. Floors to the UTC day
 * boundary so the filter always includes the snapshot exactly N days ago at
 * 00:00 UTC, regardless of request time. VaultHistory entries are snapped to UTC
 * day start by the indexer.
 */
export function getPeriodStart(period: string) {
  const todayStart = Math.floor(Date.now() / 1000 / secsPerDay) * secsPerDay;
  return (todayStart - periodToStartOffset[period]).toString();
}
