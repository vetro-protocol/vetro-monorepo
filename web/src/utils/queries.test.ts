import type { UseQueryResult } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { sumUsdResults } from "./queries";

const result = (state: Partial<UseQueryResult<number>>) =>
  ({
    data: undefined,
    isError: false,
    isLoading: false,
    ...state,
  }) as UseQueryResult<number>;

describe("sumUsdResults", function () {
  it("sums the data of every result", function () {
    expect(
      sumUsdResults([result({ data: 10 }), result({ data: 2.5 })]),
    ).toEqual({ data: 12.5, isError: false, isLoading: false });
  });

  it("returns 0 for an empty list", function () {
    expect(sumUsdResults([])).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
    });
  });

  it("returns no total while any result is missing data", function () {
    expect(
      sumUsdResults([result({ data: 10 }), result({ isLoading: true })]),
    ).toEqual({ data: undefined, isError: false, isLoading: true });
  });

  it("reports an error when any result failed", function () {
    expect(
      sumUsdResults([result({ data: 10 }), result({ isError: true })]),
    ).toEqual({ data: undefined, isError: true, isLoading: false });
  });

  it("keeps reporting the error once the other results settle", function () {
    expect(
      sumUsdResults([result({ data: 10 }), result({ data: 5, isError: true })]),
    ).toEqual({ data: 15, isError: true, isLoading: false });
  });
});
