// TODO: Implement — the real mapping still has to be confirmed against the
// entry and exit windows the vault exposes per epoch. Tests shall be added
// once we make the real mapping.
export function getTermState({
  epochEnd,
  epochStart,
  now,
}: {
  epochEnd: bigint;
  epochStart: bigint;
  now: bigint;
}) {
  if (now < epochStart) {
    return "open-to-deposits";
  }
  if (now < epochEnd) {
    return "open-to-exit";
  }
  return undefined;
}
