import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatEvmAddress } from "utils/format";
import { useAccount } from "wagmi";

import { Button, ButtonIcon } from "./base/button";
import { I18nLink } from "./base/i18nLink";
import hamburgerIcon from "./icons/hamburger.svg";
import vetroLogo from "./icons/vetroLogo.svg";
import vetroLogoMobile from "./icons/vetroLogoMobile.svg";
import { MobileNavMenu } from "./mobileNavMenu";
import { NavBarLinks } from "./navbar/links";
import { WalletDrawer } from "./walletDrawer";

const VetroLogo = () => (
  <I18nLink className="mr-auto flex items-center" to="/">
    <img alt="Vetro Logo" className="md:hidden" src={vetroLogoMobile} />
    <img alt="Vetro Logo" className="max-md:hidden" src={vetroLogo} />
  </I18nLink>
);

export function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <>
      <div className="flex h-16 items-center gap-x-3 border-b border-gray-200 px-6 md:justify-between">
        <VetroLogo />
        <div className="hidden flex-1 justify-center xl:flex">
          <NavBarLinks />
        </div>
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
        <div className="md:hidden">
          <ButtonIcon
            aria-label={t("nav.open-menu")}
            onClick={() => setIsMobileMenuOpen(true)}
            variant="secondary"
          >
            <img alt="" src={hamburgerIcon} />
          </ButtonIcon>
        </div>
      </div>
      <div className="hidden justify-center border-b border-gray-200 py-2 md:flex xl:hidden">
        <NavBarLinks />
      </div>
      {isDrawerOpen && <WalletDrawer onClose={() => setIsDrawerOpen(false)} />}
      {isMobileMenuOpen && (
        <MobileNavMenu onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  );
}
