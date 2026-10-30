import { createChainClient, updateRpcUrls } from "@vetro-protocol/core";
import { type Address, isAddressEqual, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { hemi } from "viem/chains";

// TODO: update the address when the Router is redeployed on Vetro. Keep it in
// sync with subgraphs/hemi-earn-indexer/config.yaml.
const routerAddress: Address = "0x8a23DF259c6798F9eacC51Ae816461218c3acddc";

const routerAbi = [
  {
    inputs: [{ internalType: "address", name: "asset", type: "address" }],
    name: "assetsData",
    outputs: [
      {
        components: [
          { internalType: "address", name: "share", type: "address" },
          { internalType: "address", name: "remoteAsset", type: "address" },
          { internalType: "address", name: "remoteShare", type: "address" },
          { internalType: "bool", name: "enabled", type: "bool" },
        ],
        internalType: "struct Router.AssetData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const createHemiClient = (rpcUrl: string | undefined) =>
  createChainClient(updateRpcUrls(hemi, rpcUrl));

const shareByAssetCache = new Map<string, Promise<string>>();

/**
 * Resolve the Hemi share token of an asset through the Router registry. The
 * result is lowercase, as the indexer stores it. The mapping does not change,
 * so it is memoized; a failed read is evicted so a later call can retry it.
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
  const sharePromise = readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [key as Address],
    functionName: "assetsData",
  })
    .then(function ({ share }) {
      if (isAddressEqual(share, zeroAddress)) {
        throw new Error(`The Router has no share for asset ${asset}`);
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
