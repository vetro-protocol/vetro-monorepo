import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { oftAbi } from "../../abi/oftAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export type TokenParams = {
  oftAddress: Address;
};

// Returns the underlying ERC20 address an OFT/OFTAdapter wraps. For pure OFT
// contracts this typically returns the OFT address itself; for OFTAdapter
// contracts it returns the wrapped ERC20 (the contract callers must approve).
export async function token(
  client: Client,
  parameters: TokenParams,
): Promise<Address> {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  const { oftAddress } = parameters;

  if (!isAddressValid(oftAddress)) {
    throw new Error("OFT address is invalid");
  }

  return readContract(client, {
    abi: oftAbi,
    address: oftAddress,
    functionName: "token",
  });
}
