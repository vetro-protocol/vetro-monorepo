import { getLayerZeroEid } from "../layerZeroEids.ts";
import type { QuoteSendParams } from "../types.ts";

import { addressToBytes32 } from "./addressToBytes32.ts";

export const buildSendParam = ({
  amount,
  destinationChainId,
  minAmount,
  recipient,
}: Pick<
  QuoteSendParams,
  "amount" | "destinationChainId" | "minAmount" | "recipient"
>) => ({
  amountLD: amount,
  composeMsg: "0x" as const,
  dstEid: getLayerZeroEid(destinationChainId),
  extraOptions: "0x" as const,
  minAmountLD: minAmount ?? amount,
  oftCmd: "0x" as const,
  to: addressToBytes32(recipient),
});
