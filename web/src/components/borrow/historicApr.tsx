import { SegmentedControl } from "components/base/segmentedControl";
import {
  type AprHistoryEntry,
  type AprHistoryPeriod,
  aprHistoryPeriods,
  useAprHistory,
} from "hooks/borrow/useAprHistory";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatPercentage } from "utils/format";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory";
import type { Hash } from "viem";

type Props = {
  marketId: Hash;
};

const getAverage = function (
  entries: { x: AprHistoryEntry["timestamp"]; y: AprHistoryEntry["apr"] }[],
) {
  if (entries.length === 0) {
    return 0;
  }
  return entries.reduce((sum, e) => sum + e.y, 0) / entries.length;
};

const AreaGradient = () => (
  <defs>
    <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stopColor="#EAF4FF" />
      <stop offset="100%" stopColor="#EAF4FF" stopOpacity={0} />
    </linearGradient>
  </defs>
);

const periods = aprHistoryPeriods;

const periodLabelKeys = {
  "1m": "pages.borrow.period-1-month",
  "1w": "pages.borrow.period-1-week",
  "1y": "pages.borrow.period-1-year",
  "3m": "pages.borrow.period-3-month",
} as const;

const formatTooltipDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

const ClockRevertIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.116 3.588a.696.696 0 0 1 .697.696v3.427l1.653 1.653a.696.696 0 0 1-.984.985l-1.858-1.858a.696.696 0 0 1-.204-.492V4.284a.696.696 0 0 1 .696-.696Z"
      fill="#416BFF"
    />
    <path
      d="M11.471 11.848a5.57 5.57 0 0 1-3.428 1.261 5.57 5.57 0 0 1-3.398-1.338 5.57 5.57 0 0 1-1.641-3.254.696.696 0 1 0-1.385.155 6.96 6.96 0 0 0 2.088 4.14 6.96 6.96 0 0 0 4.32 1.702 6.96 6.96 0 0 0 4.358-1.603 6.96 6.96 0 0 0 2.182-4.091 6.96 6.96 0 0 0-1.104-4.503 6.96 6.96 0 0 0-2.993-2.052 6.96 6.96 0 0 0-3.015-.75 6.96 6.96 0 0 0-3.014.722 6.96 6.96 0 0 0-2.342 2.03V2.761a.696.696 0 1 0-1.393 0v3.247c0 .385.312.697.697.697h3.25a.696.696 0 1 0 0-1.393H3.744a5.57 5.57 0 0 1 1.938-1.815 5.57 5.57 0 0 1 3.622-.461 5.57 5.57 0 0 1 3.013 2.062 5.57 5.57 0 0 1 .868 3.537 5.57 5.57 0 0 1-1.715 3.213"
      fill="#416BFF"
    />
  </svg>
);

function ChartTooltipLabel({
  datum,
  x,
  y,
}: {
  datum?: { x: number; y: number };
  x?: number;
  y?: number;
}) {
  if (datum === undefined) {
    return null;
  }

  const dateText = formatTooltipDate(datum.x);
  const aprText = formatPercentage(datum.y);

  return (
    <text
      className="text-xss"
      dominantBaseline="central"
      textAnchor="middle"
      x={x}
      y={y}
    >
      <tspan className="fill-gray-500">{dateText}</tspan>
      <tspan className="fill-gray-900" dx={4}>
        {aprText}
      </tspan>
    </text>
  );
}

export function HistoricApr({ marketId }: Props) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AprHistoryPeriod>("1w");
  // TODO add error state https://github.com/vetro-protocol/vetro-monorepo/issues/241
  const { data: chartData } = useAprHistory(marketId, period);

  return (
    <div className="px-3 py-6 xl:px-14">
      <div className="flex items-center justify-between">
        <span className="text-b-medium text-gray-900">
          {t("pages.borrow.historic-apr")}
        </span>
        <ClockRevertIcon />
      </div>
      <div className="mt-3 flex flex-col gap-3 gap-y-6 xl:flex-row xl:items-center xl:justify-between">
        <span className="text-h3">
          {chartData !== undefined ? (
            t("pages.borrow.avg", {
              percentage: formatPercentage(getAverage(chartData)),
            })
          ) : (
            <Skeleton width={80} />
          )}
        </span>
        <SegmentedControl
          onChange={setPeriod}
          options={periods.map((p) => ({
            label: t(periodLabelKeys[p]),
            value: p,
          }))}
          size="xs"
          value={period}
          variant="pill"
        />
      </div>
      <div className="mt-10">
        {chartData !== undefined ? (
          <VictoryChart
            containerComponent={
              <VictoryVoronoiContainer
                labelComponent={
                  <VictoryTooltip
                    constrainToVisibleArea
                    cornerRadius={8}
                    flyoutPadding={{ bottom: 8, left: 12, right: 12, top: 8 }}
                    flyoutStyle={{
                      fill: "white",
                      stroke: "#E5E7EB",
                    }}
                    labelComponent={<ChartTooltipLabel />}
                    pointerLength={0}
                    style={{ fontSize: 11 }}
                  />
                }
                labels={({ datum }: { datum: { x: number; y: number } }) =>
                  `${formatTooltipDate(datum.x)}  ${formatPercentage(datum.y)}`
                }
                voronoiBlacklist={["area"]}
              />
            }
            height={200}
            padding={{ bottom: 30, left: 40, right: 16, top: 10 }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: "transparent" },
                tickLabels: {
                  fill: "#6B7280",
                  fontSize: 11,
                },
              }}
              tickCount={4}
              tickFormat={(tick: number) =>
                new Date(tick).toLocaleDateString("en-US", {
                  day: "numeric",
                  weekday: "short",
                })
              }
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: "transparent" },
                grid: {
                  stroke: "#E5E7EB",
                  strokeDasharray: "4,4",
                },
                tickLabels: {
                  fill: "#6B7280",
                  fontSize: 11,
                },
              }}
              tickFormat={formatPercentage}
            />
            <AreaGradient />
            <VictoryArea
              data={chartData}
              interpolation="linear"
              name="area"
              style={{
                data: {
                  fill: "url(#area-gradient)",
                  stroke: "none",
                },
              }}
            />
            <VictoryLine
              data={chartData}
              interpolation="linear"
              style={{
                data: {
                  stroke: "#416BFF",
                  strokeWidth: 2,
                },
              }}
            />
          </VictoryChart>
        ) : (
          <Skeleton height={200} />
        )}
      </div>
    </div>
  );
}
