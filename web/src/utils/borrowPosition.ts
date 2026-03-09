import type { AccrualPosition } from "@morpho-org/blue-sdk";

export const hasActivePosition = (
  position: AccrualPosition | undefined,
): position is AccrualPosition =>
  position !== undefined &&
  (position.collateral > 0n || position.borrowAssets > 0n);
