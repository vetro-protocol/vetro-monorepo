import enTranslation from "./locales/en/translation.json";
import esTranslation from "./locales/es/translation.json";

export const resources = {
  en: { translation: enTranslation },
  es: { translation: esTranslation },
} as const;
