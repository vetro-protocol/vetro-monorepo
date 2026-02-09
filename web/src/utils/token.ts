import type { Token } from "types";
import { formatUnits, parseUnits as viemParseUnits } from "viem";
/**
 * Parses a token amount string into its raw representation in the smallest unit (e.g., wei for ETH)
 * truncating any excess decimal places beyond the token's defined decimals.
 * @param amount - The token amount as a string.
 * @param token - The token metadata, including its decimals.
 * @returns The parsed token amount in the smallest unit.
 */
export const parseTokenUnits = function (amount: string, token: Token) {
  const [whole, fraction] = amount.split(".");
  const truncatedFraction = fraction?.slice(0, token.decimals);
  const normalizedAmount = truncatedFraction
    ? `${whole}.${truncatedFraction}`
    : whole;
  return viemParseUnits(normalizedAmount, token.decimals);
};

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
