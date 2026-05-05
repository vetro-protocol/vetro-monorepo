export function correlationCoefficient({
  x,
  y,
}: {
  x: number[];
  y: number[];
}): number {
  const n = x.length;
  let sumX = 0;
  let sumXX = 0;
  let sumXY = 0;
  let sumY = 0;
  let sumYY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumXX += x[i] * x[i];
    sumXY += x[i] * y[i];
    sumY += y[i];
    sumYY += y[i] * y[i];
  }
  return (
    (n * sumXY - sumX * sumY) /
    Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
  );
}
