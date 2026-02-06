export const isRelativeUrl = (url: string) => url.startsWith("/");

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
