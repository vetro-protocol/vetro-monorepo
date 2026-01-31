import { ConnectButton } from "@rainbow-me/rainbowkit";

import { NavBarLinks } from "./navBarLinks";

export const Header = () => (
  <div className="flex h-16 items-center justify-between px-6">
    <span>Vetro Logo</span>
    <NavBarLinks />
    <ConnectButton chainStatus="none" showBalance={false} />
  </div>
);
