import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { Header } from "./components/header";
import { Layout } from "./components/layout";
import { DexPage } from "./pages/dex";

const queryClient = new QueryClient();

export const App = () => (
  <div className="lg:px-4 xl:px-8 2xl:px-28">
    <Header />
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route element={<Navigate replace to="/dex" />} path="/" />
            <Route element={<DexPage />} path="/dex" />
            <Route element={<Navigate replace to="/dex" />} path="*" />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  </div>
);
