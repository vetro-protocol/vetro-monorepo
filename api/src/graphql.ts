import postJson from "tiny-post-json";

export class UpstreamGraphQLError extends Error {}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function runQuery<R>({
  headers,
  query,
  url,
  variables,
}: {
  headers?: Record<string, string>;
  query: string;
  url: string;
  variables?: Record<string, unknown>;
}): Promise<R> {
  const response = (await postJson(
    url,
    {
      query: query.replace(/\s+/g, " "),
      ...(variables ? { variables } : {}),
    },
    headers ? { headers } : undefined,
  ).catch(function (error) {
    throw new UpstreamGraphQLError(error.message);
  })) as GraphQLResponse<R>;
  if (!response) {
    throw new UpstreamGraphQLError("No response from GraphQL endpoint");
  }
  if (response.errors) {
    throw new UpstreamGraphQLError(
      response.errors.map((e) => e.message).join("; "),
    );
  }
  return response.data!;
}
