import { maxBigInt } from "utils/bigint";
import type { Address } from "viem";

export type CostBases = Record<Address, bigint>;

export function bumpCostBasis({
  assets,
  costBases,
  stakingVaultAddress,
}: {
  assets: bigint;
  costBases: CostBases | undefined;
  stakingVaultAddress: Address;
}) {
  if (costBases === undefined) {
    return costBases;
  }
  return {
    ...costBases,
    [stakingVaultAddress]: (costBases[stakingVaultAddress] ?? 0n) + assets,
  };
}

export function reduceCostBasisProportionally({
  assets,
  costBases,
  stakedBefore,
  stakingVaultAddress,
}: {
  assets: bigint;
  costBases: CostBases | undefined;
  stakedBefore: bigint | undefined;
  stakingVaultAddress: Address;
}) {
  if (
    costBases === undefined ||
    stakedBefore === undefined ||
    stakedBefore <= 0n
  ) {
    return costBases;
  }
  const costBasis = costBases[stakingVaultAddress] ?? 0n;
  const remaining = maxBigInt(stakedBefore - assets, 0n);
  return {
    ...costBases,
    [stakingVaultAddress]: (costBasis * remaining) / stakedBefore,
  };
}
