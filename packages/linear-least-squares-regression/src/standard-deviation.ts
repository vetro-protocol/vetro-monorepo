import { mean } from "./mean.js";

export function standardDeviation(dataset: number[]): number {
  const m = mean(dataset);
  const sumSquaredDeviations = dataset.reduce(
    (acc, value) => acc + (value - m) ** 2,
    0,
  );
  return Math.sqrt(sumSquaredDeviations / (dataset.length - 1));
}
