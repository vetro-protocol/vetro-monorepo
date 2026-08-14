import { sVusdAddress } from "@vetro-protocol/earn/addresses";
import type { Address } from "viem";

// TODO: the target-yield vaults are not deployed yet, so the list points at the
// VUSD staking vault. `VUSDx` initializes its ERC-4626 asset with VUSD and
// mints ERC-20 shares, so `asset()`, the share balance and the pool contract
// link all read sensibly from it meanwhile. Replace this with the address list
// exported by `@vetro-protocol/target-yield-earn` once they are deployed.
export const targetYieldVaultAddresses: Address[] = [sVusdAddress];
