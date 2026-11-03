// Placeholder until the ve-vetro package (#1062) is merged. Replace with
// these reads from `@vetro-protocol/ve-vetro/actions`, on a Hemi client:
// 1. `getBalanceOf(hemiClient, { address: veHemiAddress, blockNumber: veHemiSnapshotBlock, owner: account })`
// 2. `getTokenOfOwnerByIndex(hemiClient, { address: veHemiAddress, blockNumber: veHemiSnapshotBlock, index, owner: account })`
//    for each index from `0n` to the balance minus `1n`.
// Create the Hemi client with `batch: { multicall: true }` and a `multicall3`
// contract on the `hemi` chain, as the package README shows, so viem batches the
// reads at the snapshot block.
// The list includes the positions that expired before the snapshot.
export const fetchVeHemiSnapshotTokenIds = async () => [
  1042n,
  2219n,
  3307n,
  4410n,
];
