import { vToken } from "utils/veVetro";
import { parseUnits } from "viem";

// Placeholder until the ve-vetro package (#1062) is merged and the
// distributor lens is deployed. Replace with these reads from
// `@vetro-protocol/ve-vetro/actions`, on a Hemi client:
// 1. `getBalanceOf(hemiClient, { address: veHemiAddress, blockNumber: veHemiSnapshotBlock, owner: account })`
// 2. `getTokenOfOwnerByIndex(hemiClient, { address: veHemiAddress, blockNumber: veHemiSnapshotBlock, index, owner: account })`
//    for each index from `0n` to the balance minus `1n`.
// 3. `getClaimableSubset(hemiClient, { address: lensAddress, claimant: account, tokenIds })`,
//    which returns `{ amount, ids }`.
export const fetchVeVetroClaimableSubset = async () => ({
  amount: parseUnits("12478.06", vToken.decimals),
  ids: [] as bigint[],
});
