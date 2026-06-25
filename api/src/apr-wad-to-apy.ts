const WAD = 10n ** 18n;

/**
 * Convert a WAD-scaled APR (annualized reward rate) into a continuous-compounding
 * APY percentage. The vault auto-compounds continuously as yield drips into its
 * asset balance, so `apy = (e^apr - 1) * 100`. Shared by the live APY endpoint and
 * the historic APY endpoint so current and stored values use the identical formula.
 */
export function aprWadToApy(aprWad: bigint) {
  const apr = Number(aprWad) / Number(WAD);
  return Math.expm1(apr) * 100;
}
