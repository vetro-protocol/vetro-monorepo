import i18n from "i18next";
import { useLayoutEffect } from "react";
import { initReactI18next } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { resources } from "./resources";

const fallbackLng = "en";
const supportedLngs = ["en", "es"];

export const initializeI18n = () =>
  i18n.use(initReactI18next).init({
    debug: import.meta.env.DEV,
    fallbackLng,
    lng: "en", // Default language
    resources,
    supportedLngs,
  });

// Component to sync the route language parameter with i18n
export const I18nInitializer = function () {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();

  useLayoutEffect(
    function () {
      if (lang && !supportedLngs.includes(lang)) {
        navigate(`/${fallbackLng}`, { replace: true });
        return;
      }
      if (lang && i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    },
    [lang, navigate],
  );

  return null;
};
