import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { veVetroDistributorLensAbi } from "../../abi/veVetroDistributorLensAbi.ts";

export async function getIdsOfRecord(
  client: Client,
  parameters: {
    address: Address;
    fromId: bigint;
    holder: Address;
    toIdExclusive: bigint;
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

  if (!isAddressValid(parameters.holder)) {
    throw new Error("Holder address is invalid");
  }

  if (typeof parameters.fromId !== "bigint") {
    throw new Error("From ID must be a bigint");
  }

  if (typeof parameters.toIdExclusive !== "bigint") {
    throw new Error("To ID must be a bigint");
  }

  if (parameters.fromId > parameters.toIdExclusive) {
    throw new Error("From ID must not be greater than to ID");
  }

  const [ids, nextId] = await readContract(client, {
    abi: veVetroDistributorLensAbi,
    address: parameters.address,
    args: [parameters.holder, parameters.fromId, parameters.toIdExclusive],
    functionName: "idsOfRecord",
  });

  return { ids, nextId };
}
