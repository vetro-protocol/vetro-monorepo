import type { FetchStatus } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { QueryResult } from "../../src/components/base/queryResult";

type Query = {
  data: number | undefined;
  fetchStatus: FetchStatus | undefined;
  isError: boolean;
};

const renderQuery = ({ idle, query }: { idle?: string; query: Query }) =>
  render(
    <QueryResult
      data={(data) => `data ${data}`}
      error="error"
      idle={idle}
      loading="loading"
      query={query}
    />,
  );

describe("QueryResult", function () {
  it("renders the data before the error", async function () {
    const screen = await renderQuery({
      query: { data: 0, fetchStatus: "idle", isError: true },
    });

    await expect.element(screen.getByText("data 0")).toBeInTheDocument();
  });

  it("renders the error before the idle content", async function () {
    const screen = await renderQuery({
      idle: "idle",
      query: { data: undefined, fetchStatus: "idle", isError: true },
    });

    await expect.element(screen.getByText("error")).toBeInTheDocument();
  });

  it("renders the error while the query fetches again", async function () {
    const screen = await renderQuery({
      query: { data: undefined, fetchStatus: "fetching", isError: true },
    });

    await expect.element(screen.getByText("error")).toBeInTheDocument();
  });

  it.for<FetchStatus>(["idle", "paused"])(
    "renders the idle content when the query is %s",
    async function (fetchStatus) {
      const screen = await renderQuery({
        idle: "idle",
        query: { data: undefined, fetchStatus, isError: false },
      });

      await expect.element(screen.getByText("idle")).toBeInTheDocument();
    },
  );

  it("renders the error content when idle and there is no idle content", async function () {
    const screen = await renderQuery({
      query: { data: undefined, fetchStatus: "paused", isError: false },
    });

    await expect.element(screen.getByText("error")).toBeInTheDocument();
  });

  it("renders the loading content while the query fetches", async function () {
    const screen = await renderQuery({
      idle: "idle",
      query: { data: undefined, fetchStatus: "fetching", isError: false },
    });

    await expect.element(screen.getByText("loading")).toBeInTheDocument();
  });

  it("renders the loading content when there is no fetch status", async function () {
    const screen = await renderQuery({
      idle: "idle",
      query: { data: undefined, fetchStatus: undefined, isError: false },
    });

    await expect.element(screen.getByText("loading")).toBeInTheDocument();
  });
});
