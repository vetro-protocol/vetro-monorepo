import type { AccrualPosition } from "@morpho-org/blue-sdk";
import { LIQUIDATION_WARNING_THRESHOLD } from "constants/borrow";
import { formatHealthFactor } from "utils/borrowReview";

export const hasActivePosition = (
  position: AccrualPosition | undefined,
): position is AccrualPosition =>
  position !== undefined &&
  (position.collateral > 0n || position.borrowAssets > 0n);

export const isPositionAtRisk = function (
  healthFactor: bigint | undefined,
): boolean {
  const hf = formatHealthFactor(healthFactor);
  return hf !== null && hf <= LIQUIDATION_WARNING_THRESHOLD;
};
