import type { Client } from "viem";

// Placeholder until the ve-vetro package (#1062) is merged and the
// distributor is deployed. Replace with
// `isClaimOpen(client, { address: distributorAddress })` from
// `@vetro-protocol/ve-vetro/actions`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchVeVetroIsClaimOpen = async (_client: Client) => true;
