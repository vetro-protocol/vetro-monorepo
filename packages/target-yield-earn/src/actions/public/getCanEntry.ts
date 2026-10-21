import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { entryGateAbi } from "../../abi/entryGateAbi.ts";

export async function getCanEntry(
  client: Client,
  parameters: {
    address: Address;
    owner: Address;
    vault: Address;
  },
) {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  if (!isAddressValid(parameters.address)) {
    throw new Error("Entry gate address is invalid");
  }

  if (!isAddressValid(parameters.owner)) {
    throw new Error("Owner address is invalid");
  }

  if (!isAddressValid(parameters.vault)) {
    throw new Error("Vault address is invalid");
  }

  return readContract(client, {
    abi: entryGateAbi,
    address: parameters.address,
    args: [parameters.vault, parameters.owner],
    functionName: "canEntry",
  });
}
