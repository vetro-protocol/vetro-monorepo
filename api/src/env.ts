import { UpstreamGraphQLError } from "./graphql.ts";

export function theGraphSubgraph({
  apiKey,
  subgraphId,
}: {
  apiKey: string | undefined;
  subgraphId: string;
}) {
  if (!apiKey) {
    throw new Error("SUBGRAPH_API_KEY must be set");
  }
  return {
    headers: { Authorization: `Bearer ${apiKey}` },
    url: `https://gateway.thegraph.com/api/subgraphs/id/${subgraphId}`,
  };
}

export type Subgraph = {
  headers?: Record<string, string>;
  url: string;
};

export function getVetroAppSubgraph(env: Env) {
  if (env.VETRO_APP_SUBGRAPH_URL) {
    return { url: env.VETRO_APP_SUBGRAPH_URL };
  }
  if (!env.VETRO_APP_SUBGRAPH_ID) {
    throw new Error("VETRO_APP_SUBGRAPH_ID must be set");
  }
  return theGraphSubgraph({
    apiKey: env.SUBGRAPH_API_KEY,
    subgraphId: env.VETRO_APP_SUBGRAPH_ID,
  });
}

export function getVeVetroSubgraph(env: Env) {
  if (env.VE_VETRO_SUBGRAPH_URL) {
    return { url: env.VE_VETRO_SUBGRAPH_URL };
  }
  if (!env.VE_VETRO_SUBGRAPH_ID) {
    throw new Error("VE_VETRO_SUBGRAPH_ID must be set");
  }
  return theGraphSubgraph({
    apiKey: env.SUBGRAPH_API_KEY,
    subgraphId: env.VE_VETRO_SUBGRAPH_ID,
  });
}

export function getHemiEarnIndexer(env: Env) {
  if (!env.HEMI_EARN_INDEXER_URL) {
    throw new UpstreamGraphQLError("HEMI_EARN_INDEXER_URL must be set");
  }
  return {
    ...(env.HEMI_EARN_INDEXER_API_KEY
      ? {
          headers: { Authorization: `Bearer ${env.HEMI_EARN_INDEXER_API_KEY}` },
        }
      : {}),
    url: env.HEMI_EARN_INDEXER_URL,
  };
}
