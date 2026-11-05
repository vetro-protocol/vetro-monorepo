import type { Client } from "viem";

// Placeholder until the distributor is deployed. Replace with
// `getConfig(client, { address: distributorAddress })` from
// `@vetro-protocol/ve-vetro/actions`, which returns the full config. All its
// timestamps are `0n` while the config is not set.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchVeVetroConfig = async (_client: Client) => ({
  claimEnd: 1800835140n,
  requireTermsSignature: true,
  snapshotTimestamp: 1792972800n,
  unlockTimestamp: 1808776440n,
});
