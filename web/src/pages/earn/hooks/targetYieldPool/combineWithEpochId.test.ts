import type { UseQueryResult } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { combineWithEpochId } from "./combineWithEpochId";

const result = <T>(state: Partial<UseQueryResult<T>>) =>
  ({
    data: undefined,
    isError: false,
    isLoading: false,
    isPending: true,
    ...state,
  }) as UseQueryResult<T>;

const settled = <T>(data: T) =>
  result<T>({ data, isLoading: false, isPending: false });

const failed = <T>() =>
  result<T>({ isError: true, isLoading: false, isPending: false });

const gated = <T>() => result<T>({ isLoading: false, isPending: true });

describe("combineWithEpochId", function () {
  it("loads while the epoch id is read", function () {
    expect(
      combineWithEpochId({
        epochId: result<bigint>({ isLoading: true }),
        query: gated<string>(),
      }),
    ).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isPending: true,
    });
  });

  it("loads while the dependent query fetches", function () {
    expect(
      combineWithEpochId({
        epochId: settled(1n),
        query: result<string>({ isLoading: true }),
      }),
    ).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isPending: true,
    });
  });

  it("returns the data once both settle", function () {
    expect(
      combineWithEpochId({ epochId: settled(1n), query: settled("term") }),
    ).toEqual({
      data: "term",
      isError: false,
      isLoading: false,
      isPending: false,
    });
  });

  it("stops loading when the epoch id read fails", function () {
    expect(
      combineWithEpochId({ epochId: failed<bigint>(), query: gated<string>() }),
    ).toEqual({
      data: undefined,
      isError: true,
      isLoading: false,
      isPending: false,
    });
  });

  it("stops loading when the dependent query fails", function () {
    expect(
      combineWithEpochId({ epochId: settled(1n), query: failed<string>() }),
    ).toEqual({
      data: undefined,
      isError: true,
      isLoading: false,
      isPending: false,
    });
  });

  it("reports a paused dependent query as pending but not loading", function () {
    expect(
      combineWithEpochId({ epochId: settled(1n), query: gated<string>() }),
    ).toEqual({
      data: undefined,
      isError: false,
      isLoading: false,
      isPending: true,
    });
  });
});
