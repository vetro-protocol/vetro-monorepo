import config from "config";

import postToJsonApi from "./post-to-json-api.ts";

type GraphQLResponse = {
  data?: unknown;
  errors?: { message: string }[];
};

const url = config
  .get("subgraph.urlTemplate")
  .replace("$API_KEY", config.get("subgraph.apiKey"))
  .replace("$ID", config.get("subgraph.id"));

export async function runQuery(query, variables) {
  const response = await postToJsonApi<GraphQLResponse>(url, {
    query,
    variables,
  });
  if (!response) {
    throw new Error("No response from subgraph");
  }
  if (response.errors) {
    throw new Error(response.errors.map((e) => e.message).join("; "));
  }
  return response.data;
}
