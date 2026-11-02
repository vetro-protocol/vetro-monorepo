import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";

export const quoteDeposit = async function (
  client: Client,
  {
    address = hemiEarnRouterAddress,
    asset,
    assets,
    callbackFee,
  }: {
    address?: Address;
    asset: Address;
    assets: bigint;
    callbackFee: bigint;
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
  if (assets <= BigInt(0)) {
    throw new Error("Assets must be greater than zero");
  }
  if (callbackFee < BigInt(0)) {
    throw new Error("Callback fee cannot be negative");
  }

  return readContract(client, {
    abi: hemiEarnRouterAbi,
    address,
    args: [asset, assets, callbackFee],
    functionName: "quoteDeposit",
  });
};
