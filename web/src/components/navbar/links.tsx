import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { ButtonLink } from "../base/button";

import { BorrowIcon } from "./borrowIcon";
import { BridgeIcon } from "./bridgeIcon";
import { EarnIcon } from "./earnIcon";
import { SwapIcon } from "./swapIcon";

export const navLinks = [
  { href: "/swap", Icon: SwapIcon, translationKey: "nav.swap" },
  { href: "/bridge", Icon: BridgeIcon, translationKey: "nav.bridge" },
  { href: "/earn", Icon: EarnIcon, translationKey: "nav.earn" },
  { href: "/borrow", Icon: BorrowIcon, translationKey: "nav.borrow" },
] as const;

const ItemLink = ({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) => (
  <li>
    <ButtonLink href={href}>{children}</ButtonLink>
  </li>
);

export const NavBarLinks = function () {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <ul className="flex items-center gap-x-1.5">
      {navLinks.map(function ({ href, Icon, translationKey }) {
        const active = location.pathname.endsWith(href);
        return (
          <ItemLink href={href} key={href}>
            {active && <Icon className="size-4" />}
            {t(translationKey)}
          </ItemLink>
        );
      })}
    </ul>
  );
};
