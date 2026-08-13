import { sVusdAddress } from "@vetro-protocol/earn/addresses";
import { type Address, zeroAddress } from "viem";

// TODO: the target-yield vaults are not deployed yet. Replace this with the
// address list exported by `@vetro-protocol/target-yield-earn`.
export const targetYieldVaultAddresses: Address[] = [zeroAddress];

// TODO: on-chain reads are pointed at the VUSD staking vault until a
// target-yield vault exists. `VUSDx` initializes its ERC-4626 asset with VUSD
// and mints ERC-20 shares, so `asset()` and the share balance behave the same
// and swapping this address is the only change needed.
export const targetYieldVaultReadAddress = sVusdAddress;
