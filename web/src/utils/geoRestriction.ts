// Reads the geo-restriction session cookie set by the Cloudflare Worker.
// Returns true when the user is in a restricted region and wallet actions
// should be disabled.
export function isGeoRestricted(): boolean {
  const match = document.cookie.match(/(^|;\s*)geo-restricted=([^;]*)/);
  return match?.[2] === "1";
}
