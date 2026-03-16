import type { InputError } from "components/tokenInput/utils";

export function getSwapErrors({
  amount,
  maxWithdraw,
  nativeBalance,
  redeemPreview,
  tokenBalance,
}: {
  amount: bigint;
  maxWithdraw?: bigint;
  nativeBalance: bigint | undefined;
  redeemPreview?: bigint;
  tokenBalance: bigint | undefined;
}): InputError | undefined {
  if (amount === 0n) {
    return "enter-amount";
  }
  if (tokenBalance !== undefined && amount > tokenBalance) {
    return "insufficient-balance";
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas";
  }
  if (
    redeemPreview !== undefined &&
    maxWithdraw !== undefined &&
    redeemPreview > maxWithdraw
  ) {
    return "insufficient-treasury";
  }
  return undefined;
}
