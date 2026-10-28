export const getStakeDaoStrategyUrl = (strategyKey: string) =>
  `https://app.stakedao.org/strategy?protocol=curve&vault=${encodeURIComponent(strategyKey)}`;

export const isRelativeUrl = (url: string) => url.startsWith("/");

export function getUrlOrigin(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}
