import { type Address, isAddressEqual, type StateMapping } from "viem";

type StateDiffOverride = {
  address: Address;
  stateDiff: StateMapping;
}[];

export const mergeStateOverrides = (...overrides: StateDiffOverride[]) =>
  overrides.flat().reduce<StateDiffOverride>(function (merged, override) {
    const existing = merged.find((entry) =>
      isAddressEqual(entry.address, override.address),
    );
    if (!existing) {
      return [...merged, override];
    }
    return merged.map((entry) =>
      entry === existing
        ? {
            address: entry.address,
            stateDiff: [...entry.stateDiff, ...override.stateDiff],
          }
        : entry,
    );
  }, []);
