import { createChainClient, updateRpcUrls } from "@vetro-protocol/core";
import { getAssetData } from "@vetro-protocol/hemi-earn/actions";
import { type Address, isAddressEqual, zeroAddress } from "viem";
import { hemi } from "viem/chains";

export const createHemiClient = (rpcUrl: string | undefined) =>
  createChainClient(updateRpcUrls(hemi, rpcUrl));

const shareByAssetCache = new Map<string, Promise<string | null>>();

/**
 * Resolve the Hemi share token of an asset through the Router registry. The
 * result is lowercase, as the indexer stores it, or null when the Router does
 * not know the asset. A known mapping does not change, so it is memoized; an
 * unknown asset or a failed read is evicted so a later call can read it again.
 */
export function resolveShareByAsset({
  asset,
  client,
}: {
  asset: string;
  client: ReturnType<typeof createHemiClient>;
}) {
  const key = asset.toLowerCase();
  const cached = shareByAssetCache.get(key);
  if (cached) {
    return cached;
  }
  const sharePromise = getAssetData(client, { asset: key as Address })
    .then(function ({ share }) {
      if (isAddressEqual(share, zeroAddress)) {
        shareByAssetCache.delete(key);
        return null;
      }
      return share.toLowerCase();
    })
    .catch(function (error) {
      shareByAssetCache.delete(key);
      throw error;
    });
  shareByAssetCache.set(key, sharePromise);
  return sharePromise;
}
