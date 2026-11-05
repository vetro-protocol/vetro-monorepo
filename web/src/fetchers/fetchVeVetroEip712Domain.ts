import { veVetroChain, veVetroDistributorAddress } from "utils/veVetro";
import type { Client } from "viem";

// Placeholder until the distributor is deployed. Replace with the `domain` of
// `getEip712Domain(client, { address: veVetroDistributorAddress })` from
// `viem/actions`, which reads the distributor's ERC-5267 `eip712Domain()`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchVeVetroEip712Domain = async (_client: Client) => ({
  chainId: veVetroChain.id,
  name: "VeVetroDistributor",
  verifyingContract: veVetroDistributorAddress,
  version: "1",
});
