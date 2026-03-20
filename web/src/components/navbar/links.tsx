import { useTranslation } from "react-i18next";

import { I18nLink } from "../base/i18nLink";

import { AnalyticsIcon } from "./analyticsIcon";
import { BorrowIcon } from "./borrowIcon";
import { EarnIcon } from "./earnIcon";
import { SwapIcon } from "./swapIcon";

export const navLinks = [
  { href: "/swap", Icon: SwapIcon, translationKey: "nav.swap" },
  { href: "/earn", Icon: EarnIcon, translationKey: "nav.earn" },
  { href: "/borrow", Icon: BorrowIcon, translationKey: "nav.borrow" },
  { href: "/analytics", Icon: AnalyticsIcon, translationKey: "nav.analytics" },
] as const;

export const NavBarLinks = function () {
  const { t } = useTranslation();

  return (
    <ul className="flex items-center gap-x-1.5">
      {navLinks.map(({ href, Icon, translationKey }) => (
        <li key={href}>
          <I18nLink
            className={({ isActive }) =>
              `button--base button-x-small button-regular ${isActive ? "button-nav-primary pl-1.5!" : "button-nav-secondary"} `
            }
            to={href}
          >
            {({ isActive }) => (
              <>
                {isActive && <Icon className="size-4" />}
                {t(translationKey)}
              </>
            )}
          </I18nLink>
        </li>
      ))}
    </ul>
  );
};
