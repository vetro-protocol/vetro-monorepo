export type Env = {
  MERKL_OPPORTUNITY_ID: string;
  ORIGINS: string;
  SUBGRAPH_API_KEY: string;
  SUBGRAPH_ID: string;
  SUBGRAPH_URL_TEMPLATE: string;
};

export const getSubgraphUrl = (env: Env): string =>
  env.SUBGRAPH_URL_TEMPLATE.replace("$API_KEY", env.SUBGRAPH_API_KEY).replace(
    "$ID",
    env.SUBGRAPH_ID,
  );
