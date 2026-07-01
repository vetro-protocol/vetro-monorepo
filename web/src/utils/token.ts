import type { BridgeableToken, NativeToken, Token } from "types";
import { formatUnits, parseUnits as viemParseUnits } from "viem";

export const getTokenPrice = function (
  token: NativeToken | Token,
  prices: Record<string, string> | undefined,
) {
  const priceSymbol = (
    token.extensions?.priceSymbol ?? token.symbol
  ).toUpperCase();
  const price = prices?.[priceSymbol] ?? "0";
  return price;
};

/**
 * Parses a token amount string into its raw representation in the smallest unit (e.g., wei for ETH)
 * truncating any excess decimal places beyond the token's defined decimals.
 * @param amount - The token amount as a string.
 * @param token - The token metadata, including its decimals.
 * @returns The parsed token amount in the smallest unit.
 */
export const parseTokenUnits = function (amount: string, token: Token) {
  if (!amount) {
    return 0n;
  }
  const [whole, fraction] = amount.split(".");
  const truncatedFraction = fraction?.slice(0, token.decimals);
  const normalizedAmount = truncatedFraction
    ? `${whole}.${truncatedFraction}`
    : whole;
  return viemParseUnits(normalizedAmount, token.decimals);
};

// Trims an amount to the boundary the source OFT applies via `_removeDust`
// before sending. Pre-trimming client-side keeps "you will receive" honest
// and lets the bridge package's default `minAmountLD = amount` slippage
// check pass on-chain (without the trim, any non-zero dust reverts with
// SlippageExceeded). Assumes 1:1 bridging (no token-level OFT fees in
// `oftFeeDetails`); if a token with such fees is added, replace this with
// an on-chain `quoteOFT` call.
export function removeOftDust({
  amount,
  token,
}: {
  amount: bigint;
  token: Pick<BridgeableToken, "decimals" | "sharedDecimals">;
}) {
  if (token.decimals <= token.sharedDecimals) return amount;
  const conversionRate = 10n ** BigInt(token.decimals - token.sharedDecimals);
  return (amount / conversionRate) * conversionRate;
}

type FormatAmountParams = {
  amount: bigint | undefined;
  decimals: number;
  isError: boolean;
  symbol?: string;
};

/**
 * Formats a token amount from its raw representation (e.g., wei) to a human-readable decimal string.
 * @param params - The formatting parameters.
 * @param params.amount - The token amount in its smallest unit (bigint), or undefined if not yet loaded.
 * @param params.decimals - The number of decimal places for the token.
 * @param params.isError - Whether an error occurred while fetching the amount.
 * @returns The formatted amount as a string, "-" if error, or "..." if loading.
 */
export function formatAmount({
  amount,
  decimals,
  isError,
  symbol,
}: FormatAmountParams) {
  if (amount !== undefined) {
    const formatted = formatUnits(amount, decimals);
    return symbol ? `${formatted} ${symbol}` : formatted;
  }

  if (isError) {
    return "-";
  }

  return "...";
}
