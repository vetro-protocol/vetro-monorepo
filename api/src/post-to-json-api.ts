import postJson from "tiny-post-json";

/**
 * Make a POST request with a JSON payload and expect a JSON response.
 */
export default async function postToJsonApi<R extends Record<string, unknown>>(
  resource: string,
  payload: Record<string, unknown>,
  options: RequestInit = {},
): Promise<R> {
  const res = (await postJson(resource, payload, options)) as Response;
  if (!res.ok) {
    throw new Error(`Failed to post JSON: ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Response is not JSON");
  }
  return res.json();
}
