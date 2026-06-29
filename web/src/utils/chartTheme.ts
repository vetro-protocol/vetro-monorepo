export const chartHeight = 200;

export const chartLineStyle = {
  data: { stroke: "#416BFF", strokeWidth: 2 },
};

export const chartPadding = { bottom: 30, left: 60, right: 16, top: 10 };

export const tooltipProps = {
  constrainToVisibleArea: true,
  cornerRadius: 8,
  flyoutPadding: { bottom: 8, left: 12, right: 12, top: 8 },
  flyoutStyle: { fill: "white", stroke: "#E5E7EB" },
  pointerLength: 0,
  style: { fontSize: 11 },
};

export const xAxisStyle = {
  axis: { stroke: "transparent" },
  tickLabels: { fill: "#6B7280", fontSize: 11 },
};

export const yAxisStyle = {
  ...xAxisStyle,
  grid: { stroke: "#E5E7EB", strokeDasharray: "4,4" },
};
