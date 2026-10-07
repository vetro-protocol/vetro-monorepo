import { formatUnits } from "viem";
import { convertToAssets } from "viem-erc4626/actions";

import { client } from "../lib/client";
import { type ShareToken } from "../lib/types";

export const fetchAssetsPerShare = async function ({
  token,
}: {
  token: ShareToken;
}) {
  const assetsRaw = await convertToAssets(client, {
    address: token.address,
    shares: 10n ** BigInt(token.decimals),
  });
  return Number(formatUnits(assetsRaw, token.assetDecimals));
};
