import { supportedLngs } from "./config";

export function normalizePath(pathname: string) {
  const locale = supportedLngs.find(
    (candidate) =>
      pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`),
  );
  const withoutLocale = locale ? pathname.slice(locale.length + 1) : pathname;
  const withoutTrailingSlash = withoutLocale.replace(/\/$/, "");
  return withoutTrailingSlash || "/";
}
