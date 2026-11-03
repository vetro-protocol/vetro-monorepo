import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";

export const quoteRedeem = async function (
  client: Client,
  {
    address = hemiEarnRouterAddress,
    asset,
    callbackFee,
    isInstant,
    shares,
  }: {
    address?: Address;
    asset: Address;
    callbackFee: bigint;
    // Must match what the Agent computes (see resolveIsInstant), else it cancels instead of executing.
    isInstant: boolean;
    shares: bigint;
  },
): Promise<bigint> {
  if (!client) {
    throw new Error("Client is not defined");
  }
  if (!isAddressValid(address)) {
    throw new Error("Router address is invalid");
  }
  if (!isAddressValid(asset)) {
    throw new Error("Asset address is invalid");
  }
  if (shares <= 0n) {
    throw new Error("Shares must be greater than zero");
  }
  if (callbackFee < 0n) {
    throw new Error("Callback fee cannot be negative");
  }

  return readContract(client, {
    abi: hemiEarnRouterAbi,
    address,
    args: [asset, shares, callbackFee, isInstant],
    functionName: "quoteRedeem",
  });
};
