export function getSubgraphUrl(env: Env): string {
  if (!env.SUBGRAPH_API_KEY) {
    throw new Error("SUBGRAPH_API_KEY must be set");
  }
  if (!env.SUBGRAPH_ID) {
    throw new Error("SUBGRAPH_ID must be set");
  }
  return env.SUBGRAPH_URL_TEMPLATE.replace(
    "$API_KEY",
    env.SUBGRAPH_API_KEY,
  ).replace("$ID", env.SUBGRAPH_ID);
}
