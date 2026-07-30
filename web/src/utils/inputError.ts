import type { InputError } from "components/tokenInput/utils";

const exceedsLimit = ({
  limit,
  preview,
}: {
  limit: bigint | undefined;
  preview: bigint | undefined;
}) => preview !== undefined && limit !== undefined && preview > limit;

export function getInputError({
  amount,
  depositPreview,
  maxMint,
  maxWithdraw,
  nativeBalance,
  redeemPreview,
  tokenBalance,
}: {
  amount: bigint;
  depositPreview?: bigint;
  maxMint?: bigint;
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
  if (exceedsLimit({ limit: maxWithdraw, preview: redeemPreview })) {
    return "insufficient-treasury";
  }
  if (exceedsLimit({ limit: maxMint, preview: depositPreview })) {
    return "exceeds-max-mint";
  }
  return undefined;
}
