import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to validate that the "address" route parameter is a valid
 * Ethereum address. If invalid, the request is skipped to the next route.
 */
export function validateAddress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { address } = req.params;
  const isValid =
    typeof address === "string" && /^0x[a-f0-9]{40}$/i.test(address);
  if (!isValid) {
    next("route");
    return;
  }
  next();
}
