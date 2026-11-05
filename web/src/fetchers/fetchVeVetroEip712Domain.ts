import { veVetroChain, veVetroDistributorAddress } from "utils/veVetro";

// Placeholder until the distributor is deployed. Replace with the `domain` of
// `getEip712Domain(hemiClient, { address: veVetroDistributorAddress })` from
// `viem/actions`, which reads the distributor's ERC-5267 `eip712Domain()`.
export const fetchVeVetroEip712Domain = async () => ({
  chainId: veVetroChain.id,
  name: "VeVetroDistributor",
  verifyingContract: veVetroDistributorAddress,
  version: "1",
});
