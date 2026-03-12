import type { InputError } from "components/tokenInput/utils";

export function getSwapErrors({
  amount,
  nativeBalance,
  tokenBalance,
}: {
  amount: bigint;
  nativeBalance: bigint | undefined;
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
  return undefined;
}
