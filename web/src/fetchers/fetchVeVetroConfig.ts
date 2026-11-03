// Placeholder until the ve-vetro package (#1062) is merged and the
// distributor is deployed. Replace with
// `getConfig(hemiClient, { address: distributorAddress })` from
// `@vetro-protocol/ve-vetro/actions`, which returns the full config. All its
// timestamps are `0n` while the config is not set.
export const fetchVeVetroConfig = async () => ({
  claimEnd: 1800835140n,
  snapshotTimestamp: 1792972800n,
});
