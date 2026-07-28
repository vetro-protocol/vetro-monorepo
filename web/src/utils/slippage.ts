import { applyBps, BPS_DENOMINATOR } from "./bigint";

export const DEFAULT_SLIPPAGE = 0;

export const HIGH_SLIPPAGE_THRESHOLD = 6;

const MAX_SLIPPAGE = 100;

const TENTHS_TO_BPS = 10n;

/**
 * Reduces an expected output amount by the given slippage tolerance, returning
 * the minimum amount the user is willing to accept: `preview × (1 − slippage%)`.
 * Slippage is a percent in [0, 100] with at most one decimal. BigInt division
 * truncates toward zero, so the minimum is always floored (never rounded up).
 */
export const applySlippage = ({
  preview,
  slippage,
}: {
  preview: bigint;
  slippage: number;
}) =>
  applyBps(
    preview,
    BPS_DENOMINATOR - BigInt(Math.round(slippage * 10)) * TENTHS_TO_BPS,
  );

export const isHighSlippage = (slippage: number) =>
  slippage >= HIGH_SLIPPAGE_THRESHOLD;

export function sanitizeSlippage(raw: string) {
  if (raw === "") {
    return "";
  }
  const value = raw.replace(",", ".").replace(/^0+(?=\d)/, "");
  if (!/^\d+(\.\d?)?$/.test(value)) {
    return null;
  }
  return Number(value) > MAX_SLIPPAGE ? null : value;
}
