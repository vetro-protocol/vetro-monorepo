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

export function getSubgraph(env: Env) {
  if (env.SUBGRAPH_URL) {
    return { url: env.SUBGRAPH_URL };
  }
  if (!env.SUBGRAPH_ID) {
    throw new Error("SUBGRAPH_ID must be set");
  }
  return theGraphSubgraph({
    apiKey: env.SUBGRAPH_API_KEY,
    subgraphId: env.SUBGRAPH_ID,
  });
}
