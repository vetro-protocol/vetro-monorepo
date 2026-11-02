import { describe, expect, it, vi } from "vitest";

import * as graphql from "../src/graphql.ts";
import { paginateHasuraQuery } from "../src/paginate-hasura-query.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const headers = { Authorization: "Bearer test-key" };
const url = "https://indexer.example/v1/graphql";
const query = "query ($limit: Int!, $offset: Int!) { Thing { id } }";

const buildPage = (count: number, startId = 0) =>
  Array.from({ length: count }, (_, i) => ({ id: (startId + i).toString() }));

describe("paginate-hasura-query/paginateHasuraQuery", function () {
  it("returns [] and stops after one page when the first page is empty", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ Thing: [] });

    expect(await paginateHasuraQuery({ field: "Thing", query, url })).toEqual(
      [],
    );
    expect(graphql.runQuery).toHaveBeenCalledTimes(1);
  });

  it("fetches sequential pages until a short page, forwarding variables and headers", async function () {
    vi.mocked(graphql.runQuery)
      .mockResolvedValueOnce({ Thing: buildPage(2) })
      .mockResolvedValueOnce({ Thing: buildPage(1, 2) });

    const result = await paginateHasuraQuery({
      field: "Thing",
      headers,
      pageSize: 2,
      query,
      url,
      variables: { owner: "0xabc" },
    });

    expect(result).toEqual(buildPage(3));
    expect(graphql.runQuery).toHaveBeenCalledTimes(2);
    expect(graphql.runQuery).toHaveBeenNthCalledWith(1, {
      headers,
      query,
      url,
      variables: { limit: 2, offset: 0, owner: "0xabc" },
    });
    expect(graphql.runQuery).toHaveBeenNthCalledWith(2, {
      headers,
      query,
      url,
      variables: { limit: 2, offset: 2, owner: "0xabc" },
    });
  });

  it("throws when the response field is not an array", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      Thing: undefined,
    } as never);

    await expect(
      paginateHasuraQuery({ field: "Thing", query, url }),
    ).rejects.toThrow("Invalid indexer response for Thing");
  });
});
