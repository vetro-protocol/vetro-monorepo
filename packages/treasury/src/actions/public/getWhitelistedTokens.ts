import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { treasuryAbi } from "../../abi/treasuryAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getWhitelistedTokens(
  client: Client,
  parameters: {
    address: Address;
  },
) {
  // Validate client
  if (!client) {
    throw new Error("Client is not defined");
  }

  // Validate parameters exist
  if (!parameters) {
    throw new Error("Parameters are required");
  }

  // Validate treasury address
  if (!isAddressValid(parameters.address)) {
    throw new Error("Treasury address is invalid");
  }

  return readContract(client, {
    abi: treasuryAbi,
    address: parameters.address,
    functionName: "whitelistedTokens",
  });
}
