import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client, type Hex, isHex } from "viem";
import { readContract } from "viem/actions";

import { veVetroDistributorAbi } from "../../abi/veVetroDistributorAbi.ts";

export async function verifyTermsSignature(
  client: Client,
  parameters: {
    address: Address;
    claimant: Address;
    recipient: Address;
    signature: Hex;
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

  if (!isAddressValid(parameters.claimant)) {
    throw new Error("Claimant address is invalid");
  }

  if (!isAddressValid(parameters.recipient)) {
    throw new Error("Recipient address is invalid");
  }

  if (!isHex(parameters.signature)) {
    throw new Error("Signature must be hex");
  }

  return readContract(client, {
    abi: veVetroDistributorAbi,
    address: parameters.address,
    args: [parameters.claimant, parameters.recipient, parameters.signature],
    functionName: "verifyTermsSignature",
  });
}
