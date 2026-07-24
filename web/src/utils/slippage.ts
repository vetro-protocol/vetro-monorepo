import { applyBps, BPS_DENOMINATOR } from "./bigint";

export const DEFAULT_SLIPPAGE = 0;

export const HIGH_SLIPPAGE_THRESHOLD = 6;

export const MAX_SLIPPAGE = 100;

const PERCENT_TO_BPS = 100n;

/**
 * Reduces an expected output amount by the given slippage tolerance, returning
 * the minimum amount the user is willing to accept: `preview × (1 − slippage%)`.
 * Slippage is an integer percent in [0, 100]. BigInt division truncates toward
 * zero, so the minimum is always floored (never rounded up).
 */
export const applySlippage = ({
  preview,
  slippage,
}: {
  preview: bigint;
  slippage: number;
}) => applyBps(preview, BPS_DENOMINATOR - BigInt(slippage) * PERCENT_TO_BPS);

export const isHighSlippage = (slippage: number) =>
  slippage >= HIGH_SLIPPAGE_THRESHOLD;
