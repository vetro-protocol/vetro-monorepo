/**
 * Converts an origin glob pattern to a RegExp.
 *
 * @param origin - The origin glob pattern (e.g., "https://*.example.com").
 * @returns A RegExp that matches the given origin pattern.
 */
export const originGlobToRegExp = (origin: string): RegExp =>
  new RegExp(`^${origin.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`);
