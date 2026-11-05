import type { Client } from "viem";

// Placeholder until the distributor is deployed: the mocked previews and
// claimable subset use these token ids. Replace with
// these reads from `@vetro-protocol/ve-vetro/actions`:
// 1. `getBalanceOf(client, { address: veHemiAddress, blockNumber: veHemiSnapshotBlock, owner: account })`
// 2. `getTokenOfOwnerByIndex(client, { address: veHemiAddress, blockNumber: veHemiSnapshotBlock, index, owner: account })`
//    for each index from `0n` to the balance minus `1n`.
// Create the Hemi client with `batch: { multicall: true }` and a `multicall3`
// contract on the `hemi` chain, as the package README shows, so viem batches the
// reads at the snapshot block.
// The list includes the positions that expired before the snapshot.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchVeHemiSnapshotTokenIds = async (_client: Client) => [
  1042n,
  2219n,
  3307n,
  4410n,
];
