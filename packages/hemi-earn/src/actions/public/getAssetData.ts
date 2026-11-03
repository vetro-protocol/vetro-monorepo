import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";

export type AssetData = {
  enabled: boolean;
  // Ethereum-side counterpart the Agent uses on the fulfillment leg.
  remoteAsset: Address;
  // Ethereum staking vault (sVetToken), despite the name — carried in the deposit compose message.
  remoteShare: Address;
  share: Address;
};

export const getAssetData = async function (
  client: Client,
  {
    address = hemiEarnRouterAddress,
    asset,
  }: {
    address?: Address;
    asset: Address;
  },
): Promise<AssetData> {
  if (!client) {
    throw new Error("Client is not defined");
  }
  if (!isAddressValid(address)) {
    throw new Error("Router address is invalid");
  }
  if (!isAddressValid(asset)) {
    throw new Error("Asset address is invalid");
  }

  return readContract(client, {
    abi: hemiEarnRouterAbi,
    address,
    args: [asset],
    functionName: "assetsData",
  });
};
