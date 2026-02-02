import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { ButtonLink } from "./base/button";
import borrowSvg from "./icons/borrow.svg";
import bridgeSvg from "./icons/bridge.svg";
import earnSvg from "./icons/earn.svg";
import swapSvg from "./icons/swap.svg";

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

const NavIcon = function ({
  active,
  alt,
  src,
}: Pick<ComponentProps<"img">, "alt" | "src"> & { active: boolean }) {
  if (!active) {
    return null;
  }

  return <img alt={alt} height="16" src={src} width="16" />;
};

export const NavBarLinks = function () {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <ul className="flex items-center gap-x-1.5">
      <ItemLink href="/swap">
        <NavIcon
          alt={t("nav.swap")}
          active={location.pathname.endsWith("/swap")}
          src={swapSvg}
        />
        {t("nav.swap")}
      </ItemLink>
      <ItemLink href="/bridge">
        <NavIcon
          alt={t("nav.bridge")}
          active={location.pathname.endsWith("/bridge")}
          src={bridgeSvg}
        />
        {t("nav.bridge")}
      </ItemLink>
      <ItemLink href="/earn">
        <NavIcon
          alt={t("nav.earn")}
          active={location.pathname.endsWith("/earn")}
          src={earnSvg}
        />
        {t("nav.earn")}
      </ItemLink>
      <ItemLink href="/borrow">
        <NavIcon
          alt={t("nav.borrow")}
          active={location.pathname.endsWith("/borrow")}
          src={borrowSvg}
        />
        {t("nav.borrow")}
      </ItemLink>
    </ul>
  );
};
