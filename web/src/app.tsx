import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BrowserRouter, Route, Routes } from "react-router";

import { Analytics } from "./pages/analytics";
import { Borrow } from "./pages/borrow";
import { Bridge } from "./pages/bridge";
import { Earn } from "./pages/earn";
import { Faq } from "./pages/faq";
import { Home } from "./pages/home";
import { Swap } from "./pages/swap";

export const App = () => (
  <BrowserRouter>
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <ConnectButton />
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/earn" element={<Earn />} />
          <Route path="/borrow" element={<Borrow />} />
          <Route path="/bridge" element={<Bridge />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/faq" element={<Faq />} />
        </Routes>
      </div>
    </div>
  </BrowserRouter>
);
