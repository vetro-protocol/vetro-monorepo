import { SECONDS_PER_DAY, unixNowTimestamp } from "utils/date";

// TODO: read the epoch bounds with `epochPeriod(epochId)` from
// `@vetro-protocol/target-yield-earn` once the vault is deployed. Hardcoded to
// an epoch that has not started yet so the term state reads "open to deposits",
// and relative to now so the mocked state does not expire.
const termOffsetsByEpochId: Record<
  string,
  { endInDays: number; startInDays: number }
> = {
  "1": { endInDays: 37, startInDays: 7 },
};

export const fetchTerm = async function (epochId: bigint) {
  const { endInDays, startInDays } = termOffsetsByEpochId[epochId.toString()];
  const now = unixNowTimestamp();

  return {
    epochEnd: BigInt(now + endInDays * SECONDS_PER_DAY),
    epochStart: BigInt(now + startInDays * SECONDS_PER_DAY),
  };
};
