import i18n from "i18next";
import { useLayoutEffect } from "react";
import { initReactI18next } from "react-i18next";
import { useParams } from "react-router";

import { resources } from "./resources";

export const initializeI18n = () =>
  i18n.use(initReactI18next).init({
    debug: import.meta.env.DEV,
    fallbackLng: "en",
    lng: "en", // Default language
    resources,
    supportedLngs: ["en", "es"],
  });

// Component to sync the route language parameter with i18n
export const I18nInitializer = function () {
  const { lang } = useParams<{ lang: string }>();

  useLayoutEffect(
    function () {
      if (lang && i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    },
    [lang],
  );

  return null;
};
