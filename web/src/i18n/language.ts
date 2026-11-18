export const fallbackLng = "en";
export const supportedLngs = ["en", "es"] as const;

const languageStorageKey = "vetro-language";

const isSupportedLanguage = (
  language: string | null | undefined,
): language is (typeof supportedLngs)[number] =>
  supportedLngs.some((supportedLanguage) => supportedLanguage === language);

export function getLanguageFromPath(pathname: string) {
  const [, candidate] = pathname.split("/");
  return supportedLngs.find((language) => language === candidate);
}

export function getPreferredLanguage({
  browserLanguage,
  storedLanguage,
}: {
  browserLanguage: string;
  storedLanguage: string | null;
}) {
  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  const [browserLanguageCode] = browserLanguage.toLowerCase().split("-");
  if (isSupportedLanguage(browserLanguageCode)) {
    return browserLanguageCode;
  }

  return fallbackLng;
}

function getStoredLanguage() {
  try {
    return localStorage.getItem(languageStorageKey);
  } catch {
    // Ignore persistence errors (e.g., blocked storage)
    return null;
  }
}

export function storeLanguage(language: string) {
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    // Ignore persistence errors (e.g., blocked storage)
  }
}

export const detectLanguage = () =>
  getPreferredLanguage({
    browserLanguage: navigator.language,
    storedLanguage: getStoredLanguage(),
  });
