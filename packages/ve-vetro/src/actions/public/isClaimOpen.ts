import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { veVetroDistributorAbi } from "../../abi/veVetroDistributorAbi.ts";

export async function isClaimOpen(
  client: Client,
  parameters: {
    address: Address;
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

  return readContract(client, {
    abi: veVetroDistributorAbi,
    address: parameters.address,
    functionName: "isClaimOpen",
  });
}
