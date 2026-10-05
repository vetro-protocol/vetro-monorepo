import { formatUnits } from "viem";
import { convertToAssets } from "viem-erc4626/actions";

import { client } from "../lib/client";
import { type TrackedToken } from "../lib/types";

export const fetchAssetsPerShare = async function ({
  token,
}: {
  token: TrackedToken;
}) {
  if (token.assetDecimals === undefined) {
    throw new Error(`Missing asset decimals for share token ${token.address}`);
  }
  const assetsRaw = await convertToAssets(client, {
    address: token.address,
    shares: 10n ** BigInt(token.decimals),
  });
  return Number(formatUnits(assetsRaw, token.assetDecimals));
};
