import {
  marketIds as coreMarketIds,
  morphoBlueAddress as coreMorphoBlueAddress,
} from "@vetro-protocol/core";
import type { Address, Hash } from "viem";

// Re-declared rather than re-exported: `export … from` emits the same
// re-export into the .d.ts, pointing consumers at a package private to this
// monorepo. The explicit annotations keep the declarations self-contained.
export const morphoBlueAddress: Address = coreMorphoBlueAddress;

export const marketIds: Hash[] = coreMarketIds;
