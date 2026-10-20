import type { DepositRequest } from "fetchers/earn/targetYieldPool/fetchDepositRequest";

export function applyRequestDeposit({
  assets,
  depositRequest,
}: {
  assets: bigint;
  depositRequest: DepositRequest | undefined;
}) {
  if (depositRequest === undefined) {
    return undefined;
  }
  const pendingAssets = depositRequest.pendingAssets + assets;
  return {
    cancelableAssets: pendingAssets,
    claimableAssets: 0n,
    claimableShares: 0n,
    maxDepositAssets: 0n,
    pendingAssets,
  };
}
