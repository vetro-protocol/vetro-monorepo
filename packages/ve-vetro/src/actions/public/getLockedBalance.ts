import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { veHemiAbi } from "../../abi/veHemiAbi.ts";

export async function getLockedBalance(
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
    throw new Error("ve-vetro address is invalid");
  }

  if (typeof parameters.tokenId !== "bigint") {
    throw new Error("Token ID must be a bigint");
  }

  return readContract(client, {
    abi: veHemiAbi,
    address: parameters.address,
    args: [parameters.tokenId],
    functionName: "getLockedBalance",
  });
}
