import { AppLayout } from "components/base/appLayout";
import { Header } from "components/header";
import { SwitchLanguage } from "components/switchLanguage";
import { I18nInitializer } from "i18n/config";
import { Analytics } from "pages/analytics";
import { Borrow } from "pages/borrow";
import { Bridge } from "pages/bridge";
import { Earn } from "pages/earn";
import { Faq } from "pages/faq";
import { Swap } from "pages/swap";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

export const App = () => (
  <BrowserRouter>
    <AppLayout>
      <Routes>
        {/* Redirect root to English */}
        <Route path="/" element={<Navigate to="/en" replace />} />

        {/* Language-prefixed routes */}
        <Route
          path="/:lang/*"
          element={
            <>
              <Header />
              <I18nInitializer />
              <Routes>
                <Route path="swap" element={<Swap />} />
                <Route path="earn" element={<Earn />} />
                <Route path="borrow" element={<Borrow />} />
                <Route path="bridge" element={<Bridge />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="faq" element={<Faq />} />
              </Routes>
              <SwitchLanguage />
            </>
          }
        />
      </Routes>
    </AppLayout>
  </BrowserRouter>
);
