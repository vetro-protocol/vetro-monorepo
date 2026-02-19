import postJson from "tiny-post-json";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function runQuery<R>(
  url: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<R> {
  console.log(`Sending request to ${url}`);
  const response = (await postJson(url, {
    query,
    variables,
  })) as GraphQLResponse<R>;
  if (!response) {
    throw new Error("No response from subgraph");
  }
  if (response.errors) {
    throw new Error(response.errors.map((e) => e.message).join("; "));
  }
  return response.data!;
}
