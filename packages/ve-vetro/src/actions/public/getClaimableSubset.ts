import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { veVetroDistributorLensAbi } from "../../abi/veVetroDistributorLensAbi.ts";

export async function getClaimableSubset(
  client: Client,
  parameters: {
    address: Address;
    claimant: Address;
    tokenIds: readonly bigint[];
  },
) {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  if (!isAddressValid(parameters.address)) {
    throw new Error("Lens address is invalid");
  }

  if (!isAddressValid(parameters.claimant)) {
    throw new Error("Claimant address is invalid");
  }

  if (
    !Array.isArray(parameters.tokenIds) ||
    parameters.tokenIds.some((tokenId) => typeof tokenId !== "bigint")
  ) {
    throw new Error("Token IDs must be an array of bigints");
  }

  const [ids, amount] = await readContract(client, {
    abi: veVetroDistributorLensAbi,
    address: parameters.address,
    args: [parameters.claimant, parameters.tokenIds],
    functionName: "claimableSubset",
  });

  return { amount, ids };
}
