import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ButtonIcon } from "./base/button";
import { Dropdown } from "./base/dropdown";
import { ExternalLink } from "./base/externalLink";
import { I18nLink } from "./base/i18nLink";
import { DocumentIcon } from "./icons/documentIcon";
import { EllipsisHorizontalIcon } from "./icons/ellipsisHorizontalIcon";
import { ExternalLinkIcon } from "./icons/externalLinkIcon";
import { HomeIcon } from "./icons/homeIcon";
import { LinkedInIcon } from "./icons/linkedInIcon";
import { XIcon } from "./icons/xIcon";

const triggerId = "header-menu-trigger";

const itemClassName =
  "text-xsm group flex h-8 items-center gap-1.5 rounded px-3 py-2 font-medium text-gray-900 hover:bg-gray-50";

const itemIconClassName = "size-4 text-gray-500 group-hover:text-gray-900";

type MenuItem = {
  icon: ReactNode;
  label: string;
} & ({ href: string; to?: never } | { href?: never; to: string });

type Section = {
  items: MenuItem[];
  label?: string;
};

export function HeaderMenu() {
  const { t } = useTranslation();

  const sections: Section[] = [
    {
      items: [
        {
          href: "https://vetro.org/",
          icon: <HomeIcon className={itemIconClassName} />,
          label: t("nav.header-menu.homepage"),
        },
      ],
    },
    {
      items: [
        {
          href: "https://x.com/vetro_org",
          icon: <XIcon className={itemIconClassName} />,
          label: t("nav.header-menu.x"),
        },
        {
          href: "https://www.linkedin.com/company/vetro-org/",
          icon: <LinkedInIcon className={itemIconClassName} />,
          label: t("nav.header-menu.linkedin"),
        },
      ],
      label: t("nav.header-menu.socials"),
    },
    {
      items: [
        {
          icon: <DocumentIcon className={itemIconClassName} />,
          label: t("nav.header-menu.terms-and-services"),
          to: "/terms-and-services",
        },
      ],
      label: t("nav.header-menu.company"),
    },
  ];

  return (
    <Dropdown
      getItemKey={(item) => item.href ?? item.to}
      renderItem={(item) => (
        <>
          {item.icon}
          {item.label}
          {item.href && (
            <span
              aria-hidden="true"
              className="ml-auto hidden text-gray-400 group-hover:block"
            >
              <ExternalLinkIcon />
            </span>
          )}
        </>
      )}
      renderItemWrapper={function (
        { isFocused, item, onActivate, ref, tabIndex },
        children,
      ) {
        const className = `${itemClassName} ${isFocused ? "bg-gray-100" : ""}`;
        if (item.to) {
          return (
            <I18nLink
              className={className}
              onClick={onActivate}
              ref={ref}
              role="menuitem"
              tabIndex={tabIndex}
              to={item.to}
            >
              {children}
            </I18nLink>
          );
        }
        return (
          <ExternalLink
            className={className}
            href={item.href}
            onClick={onActivate}
            ref={ref}
            role="menuitem"
            tabIndex={tabIndex}
          >
            {children}
          </ExternalLink>
        );
      }}
      renderTrigger={(_isOpen, triggerProps) => (
        <ButtonIcon
          {...triggerProps}
          aria-label={t("nav.header-menu.open")}
          variant="secondary"
        >
          <EllipsisHorizontalIcon className="size-4 text-gray-500" />
        </ButtonIcon>
      )}
      sections={sections}
      triggerId={triggerId}
    />
  );
}
