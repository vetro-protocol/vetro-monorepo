import { type QueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { asset, convertToAssets } from "viem-erc4626/actions";

import { tokenInfoOptions } from "../hooks/useTokenInfo";
import { client } from "../lib/client";
import { type TrackedToken } from "../lib/types";

export const fetchAssetsPerShare = async function ({
  queryClient,
  token,
}: {
  queryClient: QueryClient;
  token: TrackedToken;
}) {
  const assetAddress = await asset(client, { address: token.address });
  const { decimals: assetDecimals } = await queryClient.ensureQueryData(
    tokenInfoOptions(assetAddress),
  );
  const assetsRaw = await convertToAssets(client, {
    address: token.address,
    shares: 10n ** BigInt(token.decimals),
  });
  return Number(formatUnits(assetsRaw, assetDecimals));
};
