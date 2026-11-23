export const getStakeDaoStrategyUrl = (strategyKey: string) =>
  `https://app.stakedao.org/strategy?protocol=curve&vault=${encodeURIComponent(strategyKey)}`;

export const isRelativeUrl = (url: string) => url.startsWith("/");

export function getCanonicalUrl(url: string) {
  const { origin, pathname, search } = new URL(url);
  return `${origin}${pathname}${search}`;
}

export function getUrlOrigin(url: string | undefined) {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}
