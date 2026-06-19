import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { yieldDistributorAbi } from "../../abi/yieldDistributorAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getPeriodFinish(
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
    throw new Error("YieldDistributor address is invalid");
  }

  return readContract(client, {
    abi: yieldDistributorAbi,
    address: parameters.address,
    functionName: "periodFinish",
  });
}
