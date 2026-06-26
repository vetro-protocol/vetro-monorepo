import { describe, expect, it } from "vitest";

import { appendLivePoint } from "../src/append-live-point.ts";

// 2024-02-14 and 2024-02-15 00:00 UTC; the live point sits 1h into 2024-02-15,
// i.e. the same UTC day as the day-aligned 1_707_955_200_000 subgraph point.
const previousDay = { timestamp: 1_707_868_800_000, value: 1 };
const currentDayStart = 1_707_955_200_000;
const livePoint = { timestamp: currentDayStart + 3_600_000, value: 9 };

describe("append-live-point/appendLivePoint", function () {
  it("returns the history unchanged when there is no live point", function () {
    const history = [previousDay];

    expect(
      appendLivePoint({
        getValue: (point) => point.value,
        history,
        livePoint: null,
      }),
    ).toBe(history);
  });

  it("appends the live point when no subgraph point shares its UTC day", function () {
    expect(
      appendLivePoint({
        getValue: (point) => point.value,
        history: [previousDay],
        livePoint,
      }),
    ).toEqual([previousDay, livePoint]);
  });

  it("returns only the live point when the history is empty", function () {
    expect(
      appendLivePoint({
        getValue: (point) => point.value,
        history: [],
        livePoint,
      }),
    ).toEqual([livePoint]);
  });

  it("keeps the day-aligned subgraph point when its value matches the live point", function () {
    const history = [
      previousDay,
      { timestamp: currentDayStart, value: livePoint.value },
    ];

    // Same UTC day and equal value: the live point is dropped as a duplicate and
    // the day-aligned subgraph point is returned untouched.
    expect(
      appendLivePoint({ getValue: (point) => point.value, history, livePoint }),
    ).toBe(history);
  });

  it("replaces the day-aligned subgraph point when its value differs from the live point", function () {
    expect(
      appendLivePoint({
        getValue: (point) => point.value,
        history: [previousDay, { timestamp: currentDayStart, value: 2 }],
        livePoint,
      }),
    ).toEqual([previousDay, livePoint]);
  });

  it("compares string values for endpoints whose points are base-units strings", function () {
    const history = [{ deposits: "100", timestamp: currentDayStart }];

    // totalDeposits points compare as strings; equal strings drop the live point.
    expect(
      appendLivePoint({
        getValue: (point) => point.deposits,
        history,
        livePoint: { deposits: "100", timestamp: livePoint.timestamp },
      }),
    ).toBe(history);
  });
});
