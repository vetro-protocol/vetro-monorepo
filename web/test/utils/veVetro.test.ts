import { minClaimAmount } from "@vetro-protocol/ve-vetro";
import type { Log, TransactionReceipt } from "viem";
import { describe, expect, it } from "vitest";

import {
  addClaimedPositions,
  getClaimBlocker,
  getClaimedPositions,
} from "../../src/utils/veVetro";

const claimable = {
  amount: minClaimAmount,
  hasClaimEnded: false,
  isClaimOpen: true,
};

describe("getClaimBlocker", function () {
  it("returns undefined when the claim is open and the amount is at the minimum", function () {
    expect(getClaimBlocker(claimable)).toBeUndefined();
  });

  it("returns undefined when the amount is above the minimum", function () {
    expect(
      getClaimBlocker({ ...claimable, amount: minClaimAmount + 1n }),
    ).toBeUndefined();
  });

  it("returns below-minimum when the amount is below the minimum", function () {
    expect(getClaimBlocker({ ...claimable, amount: minClaimAmount - 1n })).toBe(
      "below-minimum",
    );
  });

  it("returns nothing-to-claim when the amount is zero", function () {
    expect(getClaimBlocker({ ...claimable, amount: 0n })).toBe(
      "nothing-to-claim",
    );
  });

  it("returns not-open when the distributor reports claims are not open", function () {
    expect(getClaimBlocker({ ...claimable, isClaimOpen: false })).toBe(
      "not-open",
    );
  });

  it("returns not-open when the claim end has passed", function () {
    expect(getClaimBlocker({ ...claimable, hasClaimEnded: true })).toBe(
      "not-open",
    );
  });

  it("returns not-open before an amount issue", function () {
    expect(
      getClaimBlocker({ ...claimable, amount: 0n, isClaimOpen: false }),
    ).toBe("not-open");
  });
});

// The veVETRO Deposit log of a Hemi Sepolia claim, which minted position 1.
const depositLog: Log = {
  address: "0xc0a49f097dbee078cf1ee55baef7d7bdb73f9715",
  blockHash: null,
  blockNumber: null,
  data: "0x000000000000000000000000000000000000000000000023c757072b8e73482e000000000000000000000000000000000000000000000000000000006bb7a960000000000000000000000000000000000000000000000000000000006aec94c8",
  logIndex: null,
  removed: false,
  topics: [
    "0x7162984403f6c73c8639375d45a9187dfd04602231bd8e587c415718b5f7e5f9",
    "0x000000000000000000000000f55b1c52d4b2a942e531c4f4d960f946d4c307dc",
    "0x0000000000000000000000000000000000000000000000000000000000000001",
  ],
  transactionHash: null,
  transactionIndex: null,
};

const toReceipt = (logs: Log[]) => ({ logs }) as TransactionReceipt;

describe("getClaimedPositions", function () {
  // TODO re-enable once a claim makes a Deposit on the new Hemi Sepolia
  // veTEST, and replace depositLog and the expected values with that claim's.
  // eslint-disable-next-line @vitest/no-disabled-tests -- see TODO above; todo() would drop the body
  it.skip("reads the position from the veVETRO Deposit log", function () {
    // getLockedBalance(1) on the veVETRO contract returns this amount and end.
    expect(getClaimedPositions(toReceipt([depositLog]))).toEqual([
      {
        amount: 660000000000010700846n,
        tokenId: 1n,
        unlockTime: 1807198560,
      },
    ]);
  });

  it("ignores Deposit logs of other contracts", function () {
    const otherLog: Log = {
      ...depositLog,
      address: "0x0000000000000000000000000000000000000001",
    };
    expect(getClaimedPositions(toReceipt([otherLog]))).toEqual([]);
  });
});

describe("addClaimedPositions", function () {
  const existing = { amount: 5n, tokenId: 1n, unlockTime: 100 };

  it("puts a new position first", function () {
    const claimed = { amount: 7n, tokenId: 2n, unlockTime: 200 };
    expect(
      addClaimedPositions({
        claimedPositions: [claimed],
        positions: [existing],
      }),
    ).toEqual([claimed, existing]);
  });

  it("keeps a position the list already has", function () {
    const claimed = { ...existing };
    expect(
      addClaimedPositions({
        claimedPositions: [claimed],
        positions: [existing],
      }),
    ).toEqual([existing]);
  });

  it("starts from an empty list when the list is not cached", function () {
    const claimed = { amount: 7n, tokenId: 2n, unlockTime: 200 };
    expect(
      addClaimedPositions({ claimedPositions: [claimed], positions: [] }),
    ).toEqual([claimed]);
  });
});
