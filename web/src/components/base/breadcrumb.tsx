import type { ReactNode } from "react";

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
  <li aria-hidden="true" className="text-xsm text-gray-400" role="separator">
    /
  </li>
);

export const Breadcrumb = ({ backHref, items }: Props) => (
  <nav aria-label="breadcrumb">
    <ol className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 xl:pl-14">
      {backHref && (
        <>
          <li>
            <I18nLink
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
        // eslint-disable-next-line react/no-array-index-key
        <li
          className={`contents ${index === items.length - 1 ? "text-gray-700" : "text-gray-500"}`}
          key={index}
        >
          {index > 0 && <Separator />}
          {item.menu ? (
            item.menu
          ) : (
            <span className="text-mid flex items-center gap-1.5">
              {item.icon}
              {item.text}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
