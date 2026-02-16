export const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);

export function splitDecimalParts(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);

  const dotIndex = formatted.lastIndexOf(".");
  return {
    decimal: formatted.slice(dotIndex),
    integer: formatted.slice(0, dotIndex),
  };
}
