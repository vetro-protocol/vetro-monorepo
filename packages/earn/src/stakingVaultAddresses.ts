import {
  sVetBtcAddress as coreSVetBtcAddress,
  sVusdAddress as coreSVusdAddress,
  stakingVaultAddresses as coreStakingVaultAddresses,
} from "@vetro-protocol/core";
import type { Address } from "viem";

// Re-declared rather than re-exported: `export … from` emits the same
// re-export into the .d.ts, pointing consumers at a package private to this
// monorepo. The explicit annotations keep the declarations self-contained.
export const sVusdAddress: Address = coreSVusdAddress;

export const sVetBtcAddress: Address = coreSVetBtcAddress;

export const stakingVaultAddresses: Address[] = coreStakingVaultAddresses;
