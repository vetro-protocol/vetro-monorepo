import { Button } from "components/base/button";
import { SegmentedControl } from "components/base/segmentedControl";
import {
  type ShareValueHistoryPeriod,
  shareValueHistoryPeriods,
  useShareValueHistory,
} from "hooks/useShareValueHistory";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { formatDate, formatShortDate } from "utils/date";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

const chartHeight = 200;
const chartPadding = { bottom: 30, left: 60, right: 16, top: 10 };

const xAxisStyle = {
  axis: { stroke: "transparent" },
  tickLabels: { fill: "#6B7280", fontSize: 11 },
};

const yAxisStyle = {
  ...xAxisStyle,
  grid: { stroke: "#E5E7EB", strokeDasharray: "4,4" },
};

const periodLabelKeys = {
  "1m": "common.charts.period-1-month",
  "1w": "common.charts.period-1-week",
  "1y": "common.charts.period-1-year",
  "3m": "common.charts.period-3-month",
} as const;

const formatShareValue = (value: number) => value.toFixed(4);

const useElementWidth = function () {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(function observeWidth() {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(function ([entry]) {
      setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
};

export function PegStabilityCard({ peggedToken, peggedTokenError }: Props) {
  const { i18n, t } = useTranslation();
  const [period, setPeriod] = useState<ShareValueHistoryPeriod>("1w");
  const [chartContainerRef, chartWidth] = useElementWidth();
  const {
    data: chartData,
    isError: isHistoryError,
    refetch,
  } = useShareValueHistory({ peggedToken, period });

  const isError = peggedTokenError || isHistoryError;

  return (
    <div className="flex-1 px-3 py-6 md:px-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span className="text-b-medium text-gray-900">
          {t("pages.analytics.peg-stability-label")}
        </span>
        <SegmentedControl
          onChange={setPeriod}
          options={shareValueHistoryPeriods.map((p) => ({
            label: t(periodLabelKeys[p]),
            value: p,
          }))}
          size="xs"
          value={period}
          variant="pill"
        />
      </div>
      <div
        className="relative mt-6 md:mt-8"
        ref={chartContainerRef}
        style={{ height: chartHeight }}
      >
        {isError ? (
          <div className="flex h-full items-center justify-center">
            {isHistoryError ? (
              <Button onClick={() => refetch()} size="xSmall" variant="primary">
                {t("common.charts.reload-chart")}
              </Button>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>
        ) : chartData === undefined ? (
          <Skeleton height={chartHeight} />
        ) : (
          <VictoryChart
            containerComponent={
              <VictoryVoronoiContainer
                labelComponent={
                  <VictoryTooltip
                    constrainToVisibleArea
                    cornerRadius={8}
                    flyoutPadding={{ bottom: 8, left: 12, right: 12, top: 8 }}
                    flyoutStyle={{ fill: "white", stroke: "#E5E7EB" }}
                    pointerLength={0}
                    style={{ fontSize: 11 }}
                  />
                }
                labels={({ datum }: { datum: { x: number; y: number } }) =>
                  `${formatDate(datum.x / 1000, i18n.language)}  ${formatShareValue(datum.y)}`
                }
              />
            }
            height={chartHeight}
            padding={chartPadding}
            width={chartWidth || undefined}
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
              tickFormat={formatShareValue}
            />
            <VictoryLine
              data={chartData}
              interpolation="linear"
              style={{ data: { stroke: "#416BFF", strokeWidth: 2 } }}
            />
          </VictoryChart>
        )}
      </div>
    </div>
  );
}
