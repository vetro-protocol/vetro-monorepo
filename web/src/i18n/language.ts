export const fallbackLng = "en";
export const supportedLngs = ["en", "es"] as const;

export function getLanguageFromPath(pathname: string) {
  const [, candidate] = pathname.split("/");
  return supportedLngs.find((language) => language === candidate);
}
