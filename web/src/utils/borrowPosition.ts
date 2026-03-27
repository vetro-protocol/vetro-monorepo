import type { AccrualPosition } from "@morpho-org/blue-sdk";
import { LIQUIDATION_WARNING_THRESHOLD } from "constants/borrow";
import { maxUint256 } from "viem";

export const hasActivePosition = (
  position: AccrualPosition | undefined,
): position is AccrualPosition =>
  position !== undefined &&
  (position.collateral > 0n || position.borrowAssets > 0n);

export const isPositionAtRisk = (healthFactor: bigint | undefined): boolean =>
  healthFactor !== undefined &&
  healthFactor !== maxUint256 &&
  healthFactor <= LIQUIDATION_WARNING_THRESHOLD;
