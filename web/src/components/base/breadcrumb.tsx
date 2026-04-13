import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ChevronIcon } from "./chevronIcon";
import { I18nLink } from "./i18nLink";

type BreadcrumbItem =
  | { icon?: ReactNode; menu?: never; text: ReactNode }
  | { icon?: never; menu: ReactNode; text?: never };

type Props = {
  backHref?: string;
  items: BreadcrumbItem[];
};

const Separator = () => (
  <li
    aria-hidden="true"
    className="text-xsm px-3 text-gray-400"
    role="separator"
  >
    /
  </li>
);

export function Breadcrumb({ backHref, items }: Props) {
  const { t } = useTranslation();

  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center border-b border-gray-200 px-4 py-3 xl:pl-14">
        {backHref && (
          <>
            <li>
              <I18nLink
                aria-label={t("common.go-back")}
                className="flex size-8 items-center justify-center rounded-full border border-gray-200"
                to={backHref}
              >
                <ChevronIcon direction="left" />
              </I18nLink>
            </li>
            <Separator />
          </>
        )}
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && <Separator />}
            <li
              aria-current={index === items.length - 1 ? "page" : undefined}
              className={
                index === items.length - 1 ? "text-gray-700" : "text-gray-500"
              }
            >
              {item.menu ? (
                item.menu
              ) : (
                <span className="text-mid flex items-center gap-1.5">
                  {item.icon}
                  {item.text}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
