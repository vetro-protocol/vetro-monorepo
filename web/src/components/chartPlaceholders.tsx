import { Button } from "components/base/button";
import { RefreshIcon } from "components/icons/refreshIcon";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { type ChartPeriod, getPlaceholderXTicks } from "utils/chartPeriods";
import {
  chartHeight,
  chartPadding,
  xAxisStyle,
  yAxisStyle,
} from "utils/chartTheme";
import { formatShortDate } from "utils/date";
import { VictoryAxis, VictoryChart } from "victory";

function EmptyChart({
  chartWidth,
  period,
}: {
  chartWidth: number;
  period: ChartPeriod;
}) {
  const { i18n } = useTranslation();

  return (
    <VictoryChart
      height={chartHeight}
      padding={chartPadding}
      width={chartWidth || undefined}
    >
      <VictoryAxis
        style={xAxisStyle}
        tickFormat={(tick: number) =>
          formatShortDate(tick / 1000, i18n.language, "UTC")
        }
        tickValues={getPlaceholderXTicks(period)}
      />
      <VictoryAxis dependentAxis style={yAxisStyle} tickFormat={() => ""} />
    </VictoryChart>
  );
}

export function ChartPlaceholder({
  chartWidth,
  isError,
  onReload,
  period,
  skeleton,
}: {
  chartWidth: number;
  isError: boolean;
  onReload: () => void;
  period: ChartPeriod;
  skeleton: ReactNode;
}) {
  const { t } = useTranslation();

  if (!isError) {
    return (
      <div className="relative">
        <EmptyChart chartWidth={chartWidth} period={period} />
        <div className="absolute" style={chartPadding}>
          {skeleton}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="opacity-32">
        <EmptyChart chartWidth={chartWidth} period={period} />
      </div>
      <div
        className="absolute flex items-center justify-center"
        style={chartPadding}
      >
        <Button onClick={onReload} size="xSmall" variant="primary">
          <span className="opacity-72">
            <RefreshIcon className="text-blue-500" />
          </span>
          {t("common.charts.reload-chart")}
        </Button>
      </div>
    </div>
  );
}
