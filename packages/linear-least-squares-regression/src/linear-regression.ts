import { correlationCoefficient } from "./correlation-coefficient.js";
import { mean } from "./mean.js";
import { standardDeviation } from "./standard-deviation.js";

// Reimplementation of simple-linear-regression@1.0.3.
// Reference: https://github.com/diversen/simple-linear-regression/blob/283f1d67aeb2fcf38d69a35fb37f466147e8fedc/index.js
export function linearRegression({ x, y }: { x: number[]; y: number[] }): {
  a: number;
  b: number;
} {
  if (x.length !== y.length) {
    throw new Error(
      "Cannot compute linear regression: x and y must have the same length",
    );
  }
  if (x.length < 2) {
    throw new Error(
      "Cannot compute linear regression: at least 2 data points are required",
    );
  }
  const r = correlationCoefficient({ x, y });
  const a = r * (standardDeviation(y) / standardDeviation(x));
  const b = mean(y) - mean(x) * a;
  return { a, b };
}
