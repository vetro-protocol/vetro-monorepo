const BPS_DENOMINATOR = 10000n;

const TENTHS_TO_BPS = 10n;

export const DEFAULT_SLIPPAGE = 0;

export const MAX_SLIPPAGE = 100;

// TODO may be shared in a core package https://github.com/vetro-protocol/vetro-monorepo/issues/659
export const applySlippage = ({
  preview,
  slippage,
}: {
  preview: bigint;
  slippage: number;
}) =>
  (preview *
    (BPS_DENOMINATOR - BigInt(Math.round(slippage * 10)) * TENTHS_TO_BPS)) /
  BPS_DENOMINATOR;
