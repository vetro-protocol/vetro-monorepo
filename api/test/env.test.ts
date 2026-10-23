import { describe, expect, it } from "vitest";

import { getSubgraph } from "../src/env.ts";

describe("getSubgraph", function () {
  it("sends The Graph key in the Authorization header, not in the URL", function () {
    const subgraph = getSubgraph({
      SUBGRAPH_API_KEY: "test-key",
      SUBGRAPH_ID: "subgraph-id",
    });

    expect(subgraph).toStrictEqual({
      headers: { Authorization: "Bearer test-key" },
      url: "https://gateway.thegraph.com/api/subgraphs/id/subgraph-id",
    });
  });

  it("uses SUBGRAPH_URL without headers when it is set", function () {
    const subgraph = getSubgraph({
      SUBGRAPH_API_KEY: "test-key",
      SUBGRAPH_ID: "subgraph-id",
      SUBGRAPH_URL: "http://localhost:8000/subgraphs/name/vetro",
    });

    expect(subgraph).toStrictEqual({
      url: "http://localhost:8000/subgraphs/name/vetro",
    });
  });
});
