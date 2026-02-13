import type { Context, Next } from "hono";

/**
 * Middleware to validate that the "address" route parameter is a valid
 * Ethereum address. If invalid, returns a 404 response.
 */
export async function validateAddress(c: Context, next: Next) {
  const address = c.req.param("address");
  const isValid =
    typeof address === "string" && /^0x[a-f0-9]{40}$/i.test(address);
  if (!isValid) {
    return c.json({ error: "Not Found" }, 404);
  }
  return next();
}
