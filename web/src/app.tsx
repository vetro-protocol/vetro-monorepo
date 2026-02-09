import { AppLayout } from "components/base/appLayout";
import { AppViewport } from "components/base/appViewport";
import { Header } from "components/header";
import { I18nInitializer } from "i18n/config";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { Analytics } from "pages/analytics";
import { Borrow } from "pages/borrow";
import { Bridge } from "pages/bridge";
import { Earn } from "pages/earn";
import { Faq } from "pages/faq";
import { Swap } from "pages/swap";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

export const App = () => (
  <BrowserRouter>
    <NuqsAdapter>
      <AppViewport>
        <Routes>
          {/* Redirect root to English */}
          <Route element={<Navigate to="/en" replace />} path="/" />

          {/* Language-prefixed routes */}
          <Route
            element={
              <>
                <Header />
                <I18nInitializer />
                <AppLayout>
                  <Routes>
                    <Route element={<Navigate replace to="swap" />} index />
                    <Route element={<Swap />} path="swap" />
                    <Route element={<Earn />} path="earn" />
                    <Route element={<Borrow />} path="borrow" />
                    <Route element={<Bridge />} path="bridge" />
                    <Route element={<Analytics />} path="analytics" />
                    <Route element={<Faq />} path="faq" />
                  </Routes>
                </AppLayout>
              </>
            }
            path="/:lang/*"
          />
        </Routes>
      </AppViewport>
    </NuqsAdapter>
  </BrowserRouter>
);
