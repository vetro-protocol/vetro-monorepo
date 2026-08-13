import { parseUnits } from "viem";

// TODO: read the epoch's fixed rate with `rate(epochId)` from
// `@vetro-protocol/target-yield-earn` once the vault is deployed. Like the
// contract, this returns the rate as a WAD fraction, where 1e18 is 100%.
const ratesByEpochId: Record<string, bigint> = {
  "1": parseUnits("0.085", 18),
};

export const fetchTargetApy = async (epochId: bigint) =>
  ratesByEpochId[epochId.toString()];
