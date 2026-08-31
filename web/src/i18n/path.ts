import { getLanguageFromPath } from "./language";

export function normalizePath(pathname: string) {
  const language = getLanguageFromPath(pathname);
  const withoutLanguage = language
    ? pathname.slice(language.length + 1)
    : pathname;
  const withoutTrailingSlash = withoutLanguage.replace(/\/$/, "");
  return withoutTrailingSlash || "/";
}
