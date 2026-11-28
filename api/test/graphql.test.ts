import postJson from "tiny-post-json";
import { describe, expect, it, vi } from "vitest";

import { runQuery, UpstreamGraphQLError } from "../src/graphql.ts";

vi.mock("tiny-post-json", () => ({ default: vi.fn() }));

const query = "{ Thing { id } }";
const url = "https://indexer.example/v1/graphql";

describe("graphql/runQuery", function () {
  it("returns the data of the response", async function () {
    vi.mocked(postJson).mockResolvedValue({ data: { Thing: [] } });

    expect(await runQuery({ query, url })).toEqual({ Thing: [] });
  });

  it("throws an upstream error when the response has GraphQL errors", async function () {
    vi.mocked(postJson).mockResolvedValue({
      errors: [{ message: "first" }, { message: "second" }],
    });

    const result = runQuery({ query, url });

    await expect(result).rejects.toBeInstanceOf(UpstreamGraphQLError);
    await expect(result).rejects.toThrow("first; second");
  });

  it("throws an upstream error when the request fails", async function () {
    vi.mocked(postJson).mockRejectedValue(new Error("Bad Gateway"));

    await expect(runQuery({ query, url })).rejects.toBeInstanceOf(
      UpstreamGraphQLError,
    );
  });

  it("throws an upstream error when there is no response", async function () {
    vi.mocked(postJson).mockResolvedValue(undefined);

    await expect(runQuery({ query, url })).rejects.toBeInstanceOf(
      UpstreamGraphQLError,
    );
  });
});
