import { Button } from "components/base/button";
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
import { formatDate, formatShortDate } from "utils/date";
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

const periodDurations: Record<AprHistoryPeriod, number> = {
  "1m": 30 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
};

const chartPadding = { bottom: 30, left: 40, right: 16, top: 10 };

const xAxisStyle = {
  axis: { stroke: "transparent" },
  tickLabels: { fill: "#6B7280", fontSize: 11 },
};

const yAxisStyle = {
  ...xAxisStyle,
  grid: { stroke: "#E5E7EB", strokeDasharray: "4,4" },
};

const getPlaceholderXTicks = function (period: AprHistoryPeriod) {
  const now = Date.now();
  const duration = periodDurations[period];
  return Array.from(
    { length: 4 },
    (_, i) => now - duration + (i * duration) / 3,
  );
};

const EmptyChart = ({
  locale,
  period,
}: {
  locale: string;
  period: AprHistoryPeriod;
}) => (
  <VictoryChart height={200} padding={chartPadding}>
    <VictoryAxis
      style={xAxisStyle}
      tickFormat={(tick: number) => formatShortDate(tick / 1000, locale)}
      tickValues={getPlaceholderXTicks(period)}
    />
    <VictoryAxis
      dependentAxis
      style={yAxisStyle}
      tickFormat={formatPercentage}
      tickValues={[0, 2, 4, 6]}
    />
  </VictoryChart>
);

const periodLabelKeys = {
  "1m": "pages.borrow.period-1-month",
  "1w": "pages.borrow.period-1-week",
  "1y": "pages.borrow.period-1-year",
  "3m": "pages.borrow.period-3-month",
} as const;

const ArrowPathIcon = () => (
  <svg
    fill="none"
    height="12"
    viewBox="0 0 14 12"
    width="14"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M7 1.5C6.22882 1.5 5.46288 1.52209 4.70278 1.56567C4.14144 1.59785 3.69253 2.03441 3.64471 2.59448C3.63865 2.66548 3.63278 2.73653 3.62709 2.80763C3.59408 3.22053 3.2326 3.52848 2.8197 3.49547C2.40681 3.46246 2.09885 3.10098 2.13186 2.68808C2.13776 2.6143 2.14386 2.54056 2.15015 2.46689C2.26145 1.16319 3.31079 0.143005 4.61693 0.068126C5.4056 0.0229129 6.20017 0 7 0C7.79983 0 8.59439 0.0229102 9.38307 0.0681211C10.6892 0.142996 11.7385 1.16318 11.8498 2.46687C11.9064 3.12917 11.9472 3.79592 11.9719 4.46672L12.7197 3.7189C13.0126 3.42601 13.4874 3.42601 13.7803 3.7189C14.0732 4.01179 14.0732 4.48667 13.7803 4.77956L11.7796 6.78032C11.4867 7.07322 11.0118 7.07322 10.7189 6.78032L8.71967 4.78109C8.42678 4.48819 8.42678 4.01332 8.71967 3.72043C9.01256 3.42753 9.48744 3.42753 9.78033 3.72043L10.4685 4.40864C10.4444 3.80023 10.4066 3.19541 10.3553 2.59447C10.3075 2.03439 9.85856 1.59784 9.29722 1.56566C8.53712 1.52209 7.77118 1.5 7 1.5ZM2.22043 5.2192C2.51333 4.9263 2.9882 4.9263 3.28109 5.2192L5.28186 7.21996C5.57475 7.51285 5.57475 7.98773 5.28186 8.28062C4.98896 8.57351 4.51409 8.57351 4.2212 8.28062L3.53144 7.59086C3.55554 8.19944 3.5934 8.80442 3.64472 9.40552C3.69253 9.9656 4.14144 10.4022 4.70278 10.4343C5.46288 10.4779 6.22882 10.5 7 10.5C7.77118 10.5 8.53712 10.4779 9.29722 10.4343C9.85856 10.4022 10.3075 9.96559 10.3553 9.40552C10.3615 9.3329 10.3675 9.26023 10.3733 9.18749C10.4063 8.77459 10.7677 8.46659 11.1806 8.49956C11.5935 8.53252 11.9015 8.89396 11.8685 9.30686C11.8625 9.38233 11.8563 9.45775 11.8499 9.53311C11.7386 10.8368 10.6892 11.857 9.38307 11.9319C8.5944 11.9771 7.79983 12 7 12C6.20017 12 5.4056 11.9771 4.61693 11.9319C3.31079 11.857 2.26145 10.8368 2.15015 9.53312C2.0936 8.87067 2.0528 8.20378 2.02813 7.53282L1.28033 8.28062C0.987437 8.57351 0.512563 8.57351 0.21967 8.28062C-0.0732233 7.98773 -0.0732233 7.51285 0.21967 7.21996L2.22043 5.2192Z"
      fill="#416BFF"
      fillRule="evenodd"
    />
  </svg>
);

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
  locale,
  x,
  y,
}: {
  datum?: { x: number; y: number };
  locale: string;
  x?: number;
  y?: number;
}) {
  if (datum === undefined) {
    return null;
  }

  const dateText = formatDate(datum.x / 1000, locale);
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
  const { i18n, t } = useTranslation();
  const [period, setPeriod] = useState<AprHistoryPeriod>("1w");
  const { data: chartData, isError, refetch } = useAprHistory(marketId, period);

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
          ) : isError ? (
            "-"
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
      <div className="relative mt-10">
        {isError && chartData === undefined ? (
          <>
            <div className="opacity-32">
              <EmptyChart locale={i18n.language} period={period} />
            </div>
            <div
              className="absolute flex items-center justify-center"
              style={{
                bottom: chartPadding.bottom,
                left: chartPadding.left,
                right: chartPadding.right,
                top: chartPadding.top,
              }}
            >
              <Button onClick={() => refetch()} size="xSmall" variant="primary">
                <span className="opacity-72">
                  <ArrowPathIcon />
                </span>
                {t("pages.borrow.reload-chart")}
              </Button>
            </div>
          </>
        ) : chartData !== undefined ? (
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
                    labelComponent={
                      <ChartTooltipLabel locale={i18n.language} />
                    }
                    pointerLength={0}
                    style={{ fontSize: 11 }}
                  />
                }
                labels={({ datum }: { datum: { x: number; y: number } }) =>
                  `${formatDate(datum.x / 1000, i18n.language)}  ${formatPercentage(datum.y)}`
                }
                voronoiBlacklist={["area"]}
              />
            }
            height={200}
            padding={chartPadding}
          >
            <VictoryAxis
              style={xAxisStyle}
              tickCount={4}
              tickFormat={(tick: number) =>
                formatShortDate(tick / 1000, i18n.language)
              }
            />
            <VictoryAxis
              dependentAxis
              style={yAxisStyle}
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
          <>
            <div className="invisible">
              <EmptyChart locale={i18n.language} period={period} />
            </div>
            <div className="absolute inset-0">
              <Skeleton height="100%" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
