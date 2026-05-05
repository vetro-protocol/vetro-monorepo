import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { oftAbi } from "../../abi/oftAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export type ApprovalRequiredParams = {
  oftAddress: Address;
};

// Pure OFT contracts own their token ledger and debit the sender directly,
// so no ERC20 allowance is needed. OFTAdapter contracts wrap a pre-existing
// ERC20 and must `transferFrom` it into custody, which requires approval.
export async function approvalRequired(
  client: Client,
  parameters: ApprovalRequiredParams,
): Promise<boolean> {
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
    functionName: "approvalRequired",
  });
}
