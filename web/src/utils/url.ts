export const isRelativeUrl = (url: string) => url.startsWith("/");

export function getCanonicalUrl(url: string) {
  const { origin, pathname } = new URL(url);
  return `${origin}${pathname}`;
}

export function getUrlOrigin(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}
