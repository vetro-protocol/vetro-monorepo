import { AppLayout, MainContent } from "components/base/appLayout";
import { AppViewport } from "components/base/appViewport";
import { ErrorBoundary } from "components/base/errorBoundary";
import { Header } from "components/header";
import { featureFlags } from "featureFlags";
import { I18nInitializer } from "i18n/config";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { Analytics } from "pages/analytics";
import { Borrow } from "pages/borrow";
import { BorrowMarketDetails } from "pages/borrowMarketDetails";
import { Bridge } from "pages/bridge";
import { Earn } from "pages/earn";
import { ErrorPage } from "pages/errorPage";
import { Faq } from "pages/faq";
import { NotFound } from "pages/notFound";
import { Swap } from "pages/swap";
import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";

const AppNotifications = lazy(() =>
  import("components/appNotifications").then((m) => ({
    default: m.AppNotifications,
  })),
);

/**
 * Two nested ErrorBoundaries handle errors at different stages:
 * - Outer: catches errors before translations load (Header, I18nInitializer) — ErrorPage renders without i18n
 * - Inner: catches page-level errors after translations are available — ErrorPage can use translated strings
 *
 * The inner ErrorBoundary is keyed by pathname so it resets on navigation,
 * allowing recovery from page-level errors without a full reload.
 */
function LanguageRoutes() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary
      fallback={
        <MainContent>
          <ErrorPage />
        </MainContent>
      }
    >
      <Header />
      <I18nInitializer />
      <ErrorBoundary
        fallback={
          <MainContent>
            <ErrorPage />
          </MainContent>
        }
        key={pathname}
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
            <Route element={<Borrow />} path="borrow" />
            <Route element={<BorrowMarketDetails />} path="borrow/:marketId" />
            {featureFlags.bridgeEnabled && (
              <Route element={<Bridge />} path="bridge" />
            )}
            <Route element={<Analytics />} path="analytics" />
            <Route element={<Faq />} path="faq" />
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

export const App = () => (
  <BrowserRouter>
    <NuqsAdapter>
      <AppViewport>
        <Routes>
          {/* Redirect root to English */}
          <Route element={<Navigate replace to="/en" />} path="/" />

          {/* Language-prefixed routes */}
          <Route element={<LanguageRoutes />} path="/:lang/*" />

          {/* Catch-all: redirect unknown paths to English */}
          <Route element={<Navigate replace to="/en" />} path="*" />
        </Routes>
      </AppViewport>
    </NuqsAdapter>
  </BrowserRouter>
);
