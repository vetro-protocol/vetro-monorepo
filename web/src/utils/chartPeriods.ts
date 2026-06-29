export const chartPeriods = ["1w", "1m", "3m", "1y"] as const;
export type ChartPeriod = (typeof chartPeriods)[number];

export const periodLabelKeys = {
  "1m": "common.charts.period-1-month",
  "1w": "common.charts.period-1-week",
  "1y": "common.charts.period-1-year",
  "3m": "common.charts.period-3-month",
} as const;
