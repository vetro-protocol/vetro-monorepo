import { wrapReactRouterRouting } from "@sentry/react/react-router";
import { useUnsupportedLanguageRedirect } from "i18n/config";
import { detectLanguage } from "i18n/language";
import { type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

const SentryRoutes = wrapReactRouterRouting(Routes);

type Props = {
  languageRoutes: ReactNode;
};

export const defaultPage = "swap";

const PreferredLanguageSwapRedirect = function () {
  const { hash, search } = useLocation();

  return (
    <Navigate
      replace
      to={`/${detectLanguage()}/${defaultPage}${search}${hash}`}
    />
  );
};

const LanguageRoute = function ({ languageRoutes }: Props) {
  const unsupportedLanguageRedirect = useUnsupportedLanguageRedirect();

  if (unsupportedLanguageRedirect) {
    return <Navigate replace to={unsupportedLanguageRedirect} />;
  }

  return languageRoutes;
};

export const LanguageRouting = ({ languageRoutes }: Props) => (
  <SentryRoutes>
    <Route element={<PreferredLanguageSwapRedirect />} path="/" />
    <Route
      element={<LanguageRoute languageRoutes={languageRoutes} />}
      path="/:lang/*"
    />
  </SentryRoutes>
);
