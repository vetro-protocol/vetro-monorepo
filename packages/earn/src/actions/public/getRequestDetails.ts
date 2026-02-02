import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { stakingVaultAbi } from "../../abi/stakingVaultAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getRequestDetails(
  client: Client,
  parameters: {
    address: Address;
    requestId: bigint;
  },
) {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  if (!isAddressValid(parameters.address)) {
    throw new Error("StakingVault address is invalid");
  }

  if (typeof parameters.requestId !== "bigint") {
    throw new Error("Request ID must be a bigint");
  }

  return readContract(client, {
    abi: stakingVaultAbi,
    address: parameters.address,
    args: [parameters.requestId],
    functionName: "getRequestDetails",
  });
}
