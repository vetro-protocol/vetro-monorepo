import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { veHemiAbi } from "../../abi/veHemiAbi.ts";

export async function getTokenOfOwnerByIndex(
  client: Client,
  parameters: {
    address: Address;
    blockNumber?: bigint;
    index: bigint;
    owner: Address;
  },
) {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  if (!isAddressValid(parameters.address)) {
    throw new Error("ve-vetro address is invalid");
  }

  if (
    parameters.blockNumber !== undefined &&
    typeof parameters.blockNumber !== "bigint"
  ) {
    throw new Error("Block number must be a bigint");
  }

  if (typeof parameters.index !== "bigint") {
    throw new Error("Index must be a bigint");
  }

  if (!isAddressValid(parameters.owner)) {
    throw new Error("Owner address is invalid");
  }

  return readContract(client, {
    abi: veHemiAbi,
    address: parameters.address,
    args: [parameters.owner, parameters.index],
    blockNumber: parameters.blockNumber,
    functionName: "tokenOfOwnerByIndex",
  });
}
