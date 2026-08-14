import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { treasuryAbi } from "../../abi/treasuryAbi.ts";

export async function getKeeperRole(
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
    throw new Error("Treasury address is invalid");
  }

  return readContract(client, {
    abi: treasuryAbi,
    address: parameters.address,
    functionName: "KEEPER_ROLE",
  });
}
