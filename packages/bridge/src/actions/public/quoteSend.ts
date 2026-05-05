import { type Client } from "viem";
import { readContract } from "viem/actions";

import { oftAbi } from "../../abi/oftAbi.js";
import { getLayerZeroEid } from "../../layerZeroEids.js";
import type { MessagingFee, QuoteSendParams } from "../../types.js";
import { addressToBytes32 } from "../../utils/addressToBytes32.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function quoteSend(
  client: Client,
  parameters: QuoteSendParams,
): Promise<MessagingFee> {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  const { amount, destinationChainId, minAmount, oftAddress, recipient } =
    parameters;

  if (!isAddressValid(oftAddress)) {
    throw new Error("OFT address is invalid");
  }

  if (!isAddressValid(recipient)) {
    throw new Error("Recipient address is invalid");
  }

  if (typeof amount !== "bigint") {
    throw new Error("Amount must be a bigint");
  }

  if (amount <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  const sendParam = {
    amountLD: amount,
    composeMsg: "0x" as const,
    dstEid: getLayerZeroEid(destinationChainId),
    extraOptions: "0x" as const,
    minAmountLD: minAmount ?? amount,
    oftCmd: "0x" as const,
    to: addressToBytes32(recipient),
  };

  return readContract(client, {
    abi: oftAbi,
    address: oftAddress,
    args: [sendParam, false],
    functionName: "quoteSend",
  });
}
