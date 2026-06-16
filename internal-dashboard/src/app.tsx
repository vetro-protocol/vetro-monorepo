import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { Header } from "./components/header";
import { Layout } from "./components/layout";
import { CurvePage } from "./pages/curve";

export const App = () => (
  <div className="lg:px-4 xl:px-8 2xl:px-28">
    <Header />
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route element={<Navigate replace to="/curve" />} path="/" />
          <Route element={<CurvePage />} path="/curve" />
          <Route element={<Navigate replace to="/curve" />} path="*" />
        </Routes>
      </Layout>
    </BrowserRouter>
  </div>
);
