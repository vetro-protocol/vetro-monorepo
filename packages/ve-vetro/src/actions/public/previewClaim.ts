import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { veVetroDistributorAbi } from "../../abi/veVetroDistributorAbi.ts";

export async function previewClaim(
  client: Client,
  parameters: {
    address: Address;
    tokenId: bigint;
  },
) {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  if (!isAddressValid(parameters.address)) {
    throw new Error("Distributor address is invalid");
  }

  if (typeof parameters.tokenId !== "bigint") {
    throw new Error("Token ID must be a bigint");
  }

  const [ownerOfRecord, weight, bucket, share, claimed] = await readContract(
    client,
    {
      abi: veVetroDistributorAbi,
      address: parameters.address,
      args: [parameters.tokenId],
      functionName: "previewClaim",
    },
  );

  return { bucket, claimed, ownerOfRecord, share, weight };
}
