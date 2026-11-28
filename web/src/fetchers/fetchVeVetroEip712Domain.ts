import { veVetroContracts } from "utils/veVetro";
import type { Client } from "viem";
import { getEip712Domain } from "viem/actions";

export const fetchVeVetroEip712Domain = async function (client: Client) {
  const {
    domain: { chainId, name, verifyingContract, version },
  } = await getEip712Domain(client, {
    address: veVetroContracts.distributor,
  });
  return { chainId, name, verifyingContract, version };
};
