import { vetroLinks } from "@vetro-protocol/core";
import {
  fallbackLng,
  getLanguageFromPath,
  storeLanguage,
  supportedLngs,
} from "i18n/language";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

import { ButtonIcon } from "./base/button";
import { Dropdown } from "./base/dropdown";
import { ExternalLink } from "./base/externalLink";
import { I18nLink } from "./base/i18nLink";
import { BuildInfo } from "./buildInfo";
import { CheckIcon } from "./icons/checkIcon";
import { DocumentIcon } from "./icons/documentIcon";
import { ExternalLinkIcon } from "./icons/externalLinkIcon";
import { HomeIcon } from "./icons/homeIcon";
import { LinkedInIcon } from "./icons/linkedInIcon";
import { QuestionMarkCircleIcon } from "./icons/questionMarkCircleIcon";
import { SubmitRequestIcon } from "./icons/submitRequestIcon";
import { XIcon } from "./icons/xIcon";

const triggerId = "header-menu-trigger";

const itemClassName =
  "text-b-medium group flex h-8 items-center gap-1.5 rounded px-3 py-2 text-gray-900 hover:bg-gray-50";

const itemIconClassName = "size-4 text-gray-500 group-hover:text-gray-900";

function getLanguageName(language: string) {
  const displayName =
    new Intl.DisplayNames([language], { type: "language" }).of(language) ??
    language;
  return (
    displayName.charAt(0).toLocaleUpperCase(language) + displayName.slice(1)
  );
}

type MenuItem = {
  ariaCurrent?: "page";
  icon: ReactNode;
  label: string;
  lang?: string;
  onSelect?: VoidFunction;
} & ({ href: string; to?: never } | { href?: never; to: string });

type Section = {
  items: MenuItem[];
  label?: string;
};

export function HeaderMenu() {
  const { t } = useTranslation();
  const { hash, pathname, search } = useLocation();
  const currentLanguage = getLanguageFromPath(pathname) ?? fallbackLng;
  const pathWithoutLanguage = pathname.slice(currentLanguage.length + 1);

  const sections: Section[] = [
    {
      items: [
        {
          href: "https://vetro.org/",
          icon: <HomeIcon className={itemIconClassName} />,
          label: t("nav.header-menu.homepage"),
        },
        {
          href: "https://docs.vetro.org/",
          icon: <DocumentIcon className={itemIconClassName} />,
          label: t("nav.header-menu.docs"),
        },
      ],
    },
    {
      items: [
        {
          icon: <SubmitRequestIcon className={itemIconClassName} />,
          label: t("nav.header-menu.submit-request"),
          to: "/contact",
        },
      ],
      label: t("nav.header-menu.need-help"),
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
          href: vetroLinks.termsOfUseUrl,
          icon: <DocumentIcon className={itemIconClassName} />,
          label: t("nav.header-menu.terms-of-use"),
        },
        {
          href: vetroLinks.privacyPolicyUrl,
          icon: <DocumentIcon className={itemIconClassName} />,
          label: t("nav.header-menu.privacy-policy"),
        },
      ],
      label: t("nav.header-menu.company"),
    },
    {
      items: supportedLngs.map((language) => ({
        ariaCurrent: language === currentLanguage ? "page" : undefined,
        icon: (
          <span
            aria-hidden="true"
            className="w-5 shrink-0 text-xs text-gray-500"
          >
            {language.toUpperCase()}
          </span>
        ),
        label: getLanguageName(language),
        lang: language,
        onSelect: function selectLanguage() {
          storeLanguage(language);
        },
        to: `/${language}${pathWithoutLanguage}${search}${hash}`,
      })),
      label: t("nav.header-menu.language"),
    },
  ];

  return (
    <Dropdown
      getItemKey={(item) => item.href ?? item.to}
      renderFooter={(onClose) => <BuildInfo onClose={onClose} />}
      renderItem={(item) => (
        <>
          {item.icon}
          <span lang={item.lang}>{item.label}</span>
          {item.ariaCurrent && (
            <CheckIcon
              className="ml-auto size-3 text-blue-500"
              stroke="currentColor"
            />
          )}
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
          if (item.onSelect) {
            return (
              <Link
                aria-current={item.ariaCurrent}
                className={className}
                onClick={function selectLanguage() {
                  item.onSelect?.();
                  onActivate();
                }}
                ref={ref}
                role="menuitem"
                tabIndex={tabIndex}
                to={item.to}
              >
                {children}
              </Link>
            );
          }
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
          <QuestionMarkCircleIcon className="size-4 text-gray-500 group-hover:text-gray-900 group-aria-expanded:text-gray-900" />
        </ButtonIcon>
      )}
      sections={sections}
      triggerId={triggerId}
    />
  );
}
