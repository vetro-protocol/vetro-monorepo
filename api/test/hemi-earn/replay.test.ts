import { describe, expect, it } from "vitest";

import { replayCostBasis } from "../../src/hemi-earn/replay.ts";

const WAD = 10n ** 18n;

const shareA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const shareB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const deposit = ({
  share,
  shares,
  staked,
}: {
  share: string;
  shares: string;
  staked: string | null;
}) => ({ kind: "DEPOSIT" as const, share, shares, staked });

const redeem = ({ share, shares }: { share: string; shares: string }) => ({
  kind: "REDEEM" as const,
  share,
  shares,
});

const transferIn = ({
  rate,
  share,
  value,
}: {
  rate: { denominator: string; numerator: string } | null;
  share: string;
  value: string;
}) => ({ kind: "TRANSFER_IN" as const, rate, share, value });

const transferOut = ({ share, value }: { share: string; value: string }) => ({
  kind: "TRANSFER_OUT" as const,
  share,
  value,
});

describe("hemi-earn/replay/replayCostBasis", function () {
  it("adds a deposit as WAD-scaled cost basis and minted shares", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "50", staked: "100" }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: 100n * WAD,
      shares: 50n,
    });
  });

  it("sums deposits into the same share", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "50", staked: "100" }),
      deposit({ share: shareA, shares: "10", staked: "40" }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: 140n * WAD,
      shares: 60n,
    });
  });

  it("reduces the cost basis proportionally on a partial redeem", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "100", staked: "100" }),
      redeem({ share: shareA, shares: "40" }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: 60n * WAD,
      shares: 60n,
    });
  });

  it("zeroes the position on a full redeem", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "100", staked: "100" }),
      redeem({ share: shareA, shares: "100" }),
    ]);
    expect(positions.get(shareA)).toEqual({ costBasis: 0n, shares: 0n });
  });

  it("keeps shares isolated, so a redeem on one does not change another", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "100", staked: "100" }),
      deposit({ share: shareB, shares: "50", staked: "200" }),
      redeem({ share: shareA, shares: "50" }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: 50n * WAD,
      shares: 50n,
    });
    expect(positions.get(shareB)).toEqual({
      costBasis: 200n * WAD,
      shares: 50n,
    });
  });

  it("adds shares but no cost basis for a deposit with no staked amount", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "50", staked: null }),
    ]);
    expect(positions.get(shareA)).toEqual({ costBasis: 0n, shares: 50n });
  });

  it("reduces against the full balance when a deposit has no staked amount", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "100", staked: "100" }),
      deposit({ share: shareA, shares: "50", staked: null }),
      redeem({ share: shareA, shares: "60" }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: (100n * WAD * 90n) / 150n,
      shares: 90n,
    });
  });

  it("prices a transfer in at its rate", function () {
    const positions = replayCostBasis([
      transferIn({
        rate: { denominator: "100", numerator: "105" },
        share: shareA,
        value: "10",
      }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: (10n * 105n * WAD) / 100n,
      shares: 10n,
    });
  });

  it("adds no cost basis for a transfer in with no rate", function () {
    const positions = replayCostBasis([
      transferIn({ rate: null, share: shareA, value: "10" }),
    ]);
    expect(positions.get(shareA)).toEqual({ costBasis: 0n, shares: 10n });
  });

  it("reduces the cost basis proportionally on a transfer out", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "100", staked: "100" }),
      transferOut({ share: shareA, value: "40" }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: 60n * WAD,
      shares: 60n,
    });
  });

  it("replays deposits, transfers and redeems in order", function () {
    const positions = replayCostBasis([
      deposit({ share: shareA, shares: "100", staked: "100" }),
      transferIn({
        rate: { denominator: "1", numerator: "1" },
        share: shareA,
        value: "50",
      }),
      redeem({ share: shareA, shares: "30" }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: (150n * WAD * 120n) / 150n,
      shares: 120n,
    });
  });

  it("prices a position that only has transfers in", function () {
    const positions = replayCostBasis([
      transferIn({
        rate: { denominator: "2", numerator: "3" },
        share: shareA,
        value: "20",
      }),
    ]);
    expect(positions.get(shareA)).toEqual({
      costBasis: (20n * 3n * WAD) / 2n,
      shares: 20n,
    });
  });
});
