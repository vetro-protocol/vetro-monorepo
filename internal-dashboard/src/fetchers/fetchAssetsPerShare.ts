import { type QueryClient } from "@tanstack/react-query";
import { asset, convertToAssets } from "viem-erc4626/actions";

import { tokenInfoOptions } from "../hooks/useTokenInfo";
import { client } from "../lib/client";
import { type TrackedToken } from "../lib/types";

// Underlying assets per one whole share of a vault share token, read on-chain.
export const fetchAssetsPerShare = async function ({
  queryClient,
  token,
}: {
  queryClient: QueryClient;
  token: TrackedToken;
}) {
  const assetAddress = await asset(client, { address: token.address });
  // The underlying's decimals are read on demand (cached) rather than stored on
  // the token.
  const { decimals: assetDecimals } = await queryClient.ensureQueryData(
    tokenInfoOptions(assetAddress),
  );
  const assetsRaw = await convertToAssets(client, {
    address: token.address,
    shares: 10n ** BigInt(token.decimals),
  });
  return Number(assetsRaw) / 10 ** assetDecimals;
};
