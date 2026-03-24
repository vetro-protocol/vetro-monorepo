export const hasSufficientGas = (nativeBalance: bigint | undefined) =>
  nativeBalance !== undefined && nativeBalance > 0n;
