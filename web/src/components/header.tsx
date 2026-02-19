import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatEvmAddress } from "utils/format";
import { useAccount } from "wagmi";

import { Button } from "./base/button";
import vetroLogoSvg from "./icons/vetroLogo.svg";
import { NavBarLinks } from "./navBarLinks";
import { WalletDrawer } from "./walletDrawer";

export function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const { isConnected } = useAccount();

  useEffect(
    function closeDrawerOnDisconnect() {
      if (!isConnected) {
        setIsDrawerOpen(false);
      }
    },
    [isConnected],
  );

  return (
    <div className="flex h-16 items-center justify-between px-6">
      <img alt="Vetro Logo" src={vetroLogoSvg} />
      <NavBarLinks />
      <ConnectButton.Custom>
        {function ({ account, chain, mounted, openConnectModal }) {
          if (!mounted || !account || !chain) {
            return (
              <Button onClick={openConnectModal} size="xSmall">
                {t("pages.swap.form.connect-wallet")}
              </Button>
            );
          }
          return (
            <Button onClick={() => setIsDrawerOpen(true)} size="xSmall">
              {formatEvmAddress(account.address as `0x${string}`)}
            </Button>
          );
        }}
      </ConnectButton.Custom>
      {isDrawerOpen && <WalletDrawer onClose={() => setIsDrawerOpen(false)} />}
    </div>
  );
}
