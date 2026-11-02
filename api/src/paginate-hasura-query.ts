import * as graphql from "./graphql.ts";

const defaultPageSize = 100;

/**
 * Run a paginated Hasura query, accumulating every page into a single array.
 *
 * The `query` must declare `$limit: Int!` and `$offset: Int!` and select a
 * single top-level field whose name matches `field`. Pages are fetched until a
 * short (less-than-`pageSize`) page is returned.
 */
export async function paginateHasuraQuery<R>({
  field,
  headers,
  pageSize = defaultPageSize,
  query,
  url,
  variables = {},
}: {
  field: string;
  headers?: Record<string, string>;
  pageSize?: number;
  query: string;
  url: string;
  variables?: Record<string, unknown>;
}) {
  const all: R[] = [];
  let offset = 0;
  let done = false;

  while (!done) {
    const data = await graphql.runQuery<Record<string, R[]>>({
      headers,
      query,
      url,
      variables: { ...variables, limit: pageSize, offset },
    });
    const rows = data[field];
    if (!Array.isArray(rows)) {
      throw new Error(`Invalid indexer response for ${field}`);
    }
    all.push(...rows);
    done = rows.length < pageSize;
    offset += pageSize;
  }

  return all;
}
