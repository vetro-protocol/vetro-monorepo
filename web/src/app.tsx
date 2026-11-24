import { wrapReactRouterRouting } from "@sentry/react/react-router";
import { AnalyticsTracker } from "components/analyticsTracker";
import { AppLayout, MainContent } from "components/base/appLayout";
import { AppViewport } from "components/base/appViewport";
import { ErrorBoundary } from "components/base/errorBoundary";
import { GeoRestrictionRibbon } from "components/geoRestrictionRibbon";
import { Header } from "components/header";
import { ReloadOnNewVersion } from "components/reloadOnNewVersion";
import { I18nInitializer, useUnsupportedLanguageRedirect } from "i18n/config";
import { detectLanguage } from "i18n/language";
import { normalizePath } from "i18n/path";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import { Analytics } from "pages/analytics";
import { Borrow } from "pages/borrow";
import { BorrowMarketDetails } from "pages/borrowMarketDetails";
import { Bridge } from "pages/bridge";
import { Contact } from "pages/contact";
import { Earn } from "pages/earn";
import { ErrorPage } from "pages/errorPage";
import { Faq } from "pages/faq";
import { Liquidity } from "pages/liquidity";
import { NotFound } from "pages/notFound";
import { Swap } from "pages/swap";
import { VeVetro } from "pages/veVetro";
import { VeVetroClaim } from "pages/veVetroClaim";
import { Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { featureFlags } from "utils/featureFlags";
import { isGeoRestricted } from "utils/geoRestriction";
import { lazyWithReload } from "utils/lazyWithReload";

const SentryRoutes = wrapReactRouterRouting(Routes);

const analyticsEnabled =
  !!import.meta.env.VITE_ANALYTICS_URL &&
  !!import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

const AppNotifications = lazyWithReload(() =>
  import("components/appNotifications").then((m) => ({
    default: m.AppNotifications,
  })),
);

const FixedTermEarnDetails = lazyWithReload(() =>
  import("pages/fixedTermEarnDetails").then((m) => ({
    default: m.FixedTermEarnDetails,
  })),
);

const VariableYieldEarnDetails = lazyWithReload(() =>
  import("pages/variableYieldEarnDetails").then((m) => ({
    default: m.VariableYieldEarnDetails,
  })),
);

/**
 * Two nested ErrorBoundaries handle errors at different stages:
 * - Outer: catches errors before translations load (Header, I18nInitializer) — ErrorPage renders without i18n
 * - Inner: catches page-level errors after translations are available — ErrorPage can use translated strings
 *
 * The inner ErrorBoundary is keyed by the language-independent path so
 * changing languages preserves the current page state.
 */
function LanguageRoutes() {
  const { pathname } = useLocation();
  const unsupportedLanguageRedirect = useUnsupportedLanguageRedirect();

  if (unsupportedLanguageRedirect) {
    return <Navigate replace to={unsupportedLanguageRedirect} />;
  }

  return (
    <ErrorBoundary
      fallback={
        <MainContent>
          <ErrorPage />
        </MainContent>
      }
    >
      {isGeoRestricted() && <GeoRestrictionRibbon />}
      <Header />
      <I18nInitializer />
      <ErrorBoundary
        fallback={
          <MainContent>
            <ErrorPage />
          </MainContent>
        }
        key={normalizePath(pathname)}
      >
        <Routes>
          <Route element={<Navigate replace to="swap" />} index />
          <Route
            element={
              <AppLayout>
                <Outlet />
              </AppLayout>
            }
          >
            <Route element={<Swap />} path="swap" />
            <Route element={<Earn />} path="earn" />
            {featureFlags.fixedTermYield && (
              <Route
                element={
                  <Suspense>
                    <FixedTermEarnDetails />
                  </Suspense>
                }
                path="earn/fixed-term/:address"
              />
            )}
            <Route
              element={
                <Suspense>
                  <VariableYieldEarnDetails />
                </Suspense>
              }
              path="earn/variable-yield/:address"
            />
            <Route element={<Borrow />} path="borrow" />
            <Route element={<BorrowMarketDetails />} path="borrow/:marketId" />
            <Route element={<Bridge />} path="bridge" />
            <Route element={<Liquidity />} path="liquidity" />
            <Route element={<Analytics />} path="analytics" />
            <Route element={<Faq />} path="faq" />
            <Route element={<Contact />} path="contact" />
            {featureFlags.veVetro && (
              <>
                <Route element={<VeVetro />} path="vevetro" />
                <Route element={<VeVetroClaim />} path="vevetro/claim" />
              </>
            )}
          </Route>
          <Route
            element={
              <MainContent>
                <NotFound />
              </MainContent>
            }
            path="*"
          />
        </Routes>
      </ErrorBoundary>
      <Suspense>
        <AppNotifications />
      </Suspense>
    </ErrorBoundary>
  );
}

function PreferredLanguageRedirect() {
  const { hash, search } = useLocation();

  return <Navigate replace to={`/${detectLanguage()}${search}${hash}`} />;
}

export const App = () => (
  <BrowserRouter>
    <NuqsAdapter>
      {analyticsEnabled && <AnalyticsTracker />}
      <ReloadOnNewVersion />
      <AppViewport>
        <SentryRoutes>
          <Route element={<PreferredLanguageRedirect />} path="/" />

          {/* Language-prefixed routes */}
          <Route element={<LanguageRoutes />} path="/:lang/*" />

          <Route element={<PreferredLanguageRedirect />} path="*" />
        </SentryRoutes>
      </AppViewport>
    </NuqsAdapter>
  </BrowserRouter>
);
