import { describe, expect, it } from "vitest";

import {
  getHemiEarnIndexer,
  getVetroAppSubgraph,
  getVeVetroSubgraph,
} from "../src/env.ts";
import { UpstreamGraphQLError } from "../src/graphql.ts";

describe("getVetroAppSubgraph", function () {
  it("sends The Graph key in the Authorization header, not in the URL", function () {
    const subgraph = getVetroAppSubgraph({
      SUBGRAPH_API_KEY: "test-key",
      VETRO_APP_SUBGRAPH_ID: "subgraph-id",
    });

    expect(subgraph).toStrictEqual({
      headers: { Authorization: "Bearer test-key" },
      url: "https://gateway.thegraph.com/api/subgraphs/id/subgraph-id",
    });
  });

  it("uses VETRO_APP_SUBGRAPH_URL without headers when it is set", function () {
    const subgraph = getVetroAppSubgraph({
      SUBGRAPH_API_KEY: "test-key",
      VETRO_APP_SUBGRAPH_ID: "subgraph-id",
      VETRO_APP_SUBGRAPH_URL: "http://localhost:8000/subgraphs/name/vetro",
    });

    expect(subgraph).toStrictEqual({
      url: "http://localhost:8000/subgraphs/name/vetro",
    });
  });
});

describe("getVeVetroSubgraph", function () {
  it("uses The Graph gateway with the shared API key", function () {
    const subgraph = getVeVetroSubgraph({
      SUBGRAPH_API_KEY: "test-key",
      VE_VETRO_SUBGRAPH_ID: "ve-vetro-id",
    });

    expect(subgraph).toStrictEqual({
      headers: { Authorization: "Bearer test-key" },
      url: "https://gateway.thegraph.com/api/subgraphs/id/ve-vetro-id",
    });
  });

  it("uses VE_VETRO_SUBGRAPH_URL without headers when it is set", function () {
    const subgraph = getVeVetroSubgraph({
      SUBGRAPH_API_KEY: "test-key",
      VE_VETRO_SUBGRAPH_ID: "ve-vetro-id",
      VE_VETRO_SUBGRAPH_URL: "http://localhost:8000/subgraphs/name/ve-vetro",
    });

    expect(subgraph).toStrictEqual({
      url: "http://localhost:8000/subgraphs/name/ve-vetro",
    });
  });

  it("throws when neither the id nor the URL is set", function () {
    expect(() => getVeVetroSubgraph({ SUBGRAPH_API_KEY: "test-key" })).toThrow(
      "VE_VETRO_SUBGRAPH_ID must be set",
    );
  });
});

describe("getHemiEarnIndexer", function () {
  it("sends the API key in the Authorization header when it is set", function () {
    const indexer = getHemiEarnIndexer({
      HEMI_EARN_INDEXER_API_KEY: "test-key",
      HEMI_EARN_INDEXER_URL: "https://indexer.example/v1/graphql",
    });

    expect(indexer).toStrictEqual({
      headers: { Authorization: "Bearer test-key" },
      url: "https://indexer.example/v1/graphql",
    });
  });

  it("sends no headers when the API key is not set", function () {
    const indexer = getHemiEarnIndexer({
      HEMI_EARN_INDEXER_URL: "http://localhost:8080/v1/graphql",
    });

    expect(indexer).toStrictEqual({ url: "http://localhost:8080/v1/graphql" });
  });

  it("throws an upstream error when the URL is not set", function () {
    const read = () =>
      getHemiEarnIndexer({ HEMI_EARN_INDEXER_API_KEY: "test-key" });

    expect(read).toThrow(UpstreamGraphQLError);
    expect(read).toThrow("HEMI_EARN_INDEXER_URL must be set");
  });
});
