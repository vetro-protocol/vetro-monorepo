import { mergeStateOverrides } from "utils/stateOverride";
import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

const token = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const vault = "0x2222222222222222222222222222222222222222";

const allowanceDiff = {
  slot: `0x${"a".repeat(64)}`,
  value: `0x${"1".repeat(64)}`,
} as const;
const balanceDiff = {
  slot: `0x${"b".repeat(64)}`,
  value: `0x${"2".repeat(64)}`,
} as const;
const vaultDiff = {
  slot: `0x${"c".repeat(64)}`,
  value: `0x${"3".repeat(64)}`,
} as const;

describe("mergeStateOverrides", function () {
  it("joins the state diffs of entries with the same address", function () {
    expect(
      mergeStateOverrides(
        [{ address: token, stateDiff: [allowanceDiff] }],
        [
          {
            address: getAddress(token),
            stateDiff: [balanceDiff],
          },
        ],
      ),
    ).toEqual([{ address: token, stateDiff: [allowanceDiff, balanceDiff] }]);
  });

  it("keeps entries of different addresses apart", function () {
    expect(
      mergeStateOverrides(
        [{ address: token, stateDiff: [allowanceDiff] }],
        [{ address: vault, stateDiff: [vaultDiff] }],
      ),
    ).toEqual([
      { address: token, stateDiff: [allowanceDiff] },
      { address: vault, stateDiff: [vaultDiff] },
    ]);
  });

  it("ignores empty overrides", function () {
    expect(
      mergeStateOverrides(
        [],
        [{ address: token, stateDiff: [allowanceDiff] }],
        [],
      ),
    ).toEqual([{ address: token, stateDiff: [allowanceDiff] }]);
  });
});
