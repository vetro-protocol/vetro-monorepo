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

/**
 * Validates a given parameter against a list of valid options. If the parameter
 * is not valid, returns a 400 response with a message indicating the valid
 * options.
 *
 * @param paramName The name of the parameter to validate (for error messages)
 * @param validOptions An array of valid string options for the parameter
 */
export const validateParam = (paramName: string, validOptions: string[]) =>
  function (c: Context, next: Next) {
    const paramValue = c.req.param(paramName);
    if (!validOptions.includes(paramValue)) {
      return c.json(
        { error: `Invalid ${paramName}. Use: ${validOptions.join(", ")}` },
        400,
      );
    }
    return next();
  };
