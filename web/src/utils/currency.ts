import type { Token } from "types";
import { formatUnits } from "viem";

import { getTokenPrice } from "./token";

export const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);

/**
 * Formats a raw token amount (in smallest units) as a compact USD string by
 * multiplying it by the token's USD price from `usePrices` / `getTokenPrice`.
 *
 * Use this for aggregate displays (TVL, totals) where the compact `$1.2M`
 * notation of `formatUsd` is appropriate. For per-input fiat previews use
 * `RenderFiatValue` instead — it formats with full precision.
 */
export const formatTokenAmountUsd = ({
  amount,
  prices,
  token,
}: {
  amount: bigint;
  prices: Record<string, string> | undefined;
  token: Token;
}) =>
  formatUsd(
    Number(formatUnits(amount, token.decimals)) *
      Number(getTokenPrice(token, prices)),
  );

export function splitDecimalParts(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);

  const dotIndex = formatted.lastIndexOf(".");
  const decimal = formatted.slice(dotIndex);
  return {
    decimal: decimal === ".00" ? "" : decimal,
    integer: formatted.slice(0, dotIndex),
  };
}
