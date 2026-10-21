export function getExitBlockingReason({
  claimableShares,
  isOpenToExit,
  maxRequestRedeem,
  shareBalance,
}: {
  claimableShares: bigint;
  isOpenToExit: boolean | null;
  maxRequestRedeem: bigint;
  shareBalance: bigint;
}) {
  if (!isOpenToExit) {
    return "exit-window-closed";
  }
  if (shareBalance === 0n && claimableShares === 0n) {
    return "nothing-to-exit";
  }
  if (maxRequestRedeem === 0n) {
    return "earlier-exit-pending";
  }
  return undefined;
}
