import type { RequestHandler } from "express";
import pLimitOne from "promise-limit-one";
import pMemoize from "promise-mem";
import pSwr from "promise-swr";
import safeAsync from "safe-async-fn";

/**
 * Creates an Express middleware from an async function and returns a JSON
 * response. It supports caching with optional revalidation and max age.
 *
 * If revalidation is set, the function's result will be revalidated in the
 * background if the data is stale. If maxAge is set, the function's result will
 * be cached for that specified time. If none are set, the function will be
 * called on every request. Parallel requests to the handler will always result
 * in a single invocation of the function.
 *
 * @param fn - The async function to be wrapped as middleware.
 * @param options - Optional caching options.
 * @returns An Express RequestHandler that sends JSON responses.
 */
export function asyncJson(
  fn: (params) => Promise<object | object[]>,
  options?: { revalidate?: number; maxAge?: number },
): RequestHandler {
  const cachedFn = options?.revalidate
    ? pSwr(fn, options)
    : options?.maxAge
      ? pMemoize(fn, options)
      : pLimitOne(fn);
  const safeCachedFn = safeAsync(cachedFn);
  return async function (req, res) {
    const [err, data] = await safeCachedFn(req.params);
    if (err) {
      console.error(`Failed to handle request to ${req.path}: ${err.stack}`);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(200).json(data);
    }
  };
}
