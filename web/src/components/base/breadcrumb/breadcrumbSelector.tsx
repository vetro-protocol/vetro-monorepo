import type { ReactNode } from "react";

import { Button } from "../button";
import { ChevronIcon } from "../chevronIcon";
import { Dropdown } from "../dropdown";
import { I18nLink } from "../i18nLink";

type Props<T> = {
  getItemKey: (item: T) => string;
  getItemUrl: (item: T) => string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  trigger: ReactNode;
  triggerId: string;
};

export const BreadcrumbSelector = <T,>({
  getItemKey,
  getItemUrl,
  items,
  renderItem,
  trigger,
  triggerId,
}: Props<T>) => (
  <Dropdown<T>
    getItemKey={getItemKey}
    items={items}
    renderItem={renderItem}
    renderItemWrapper={(
      { isFocused, item, onActivate, ref, tabIndex },
      children,
    ) => (
      <I18nLink
        className={`text-xsm flex w-full items-center justify-between gap-2 rounded px-3 py-2 font-medium text-gray-900 focus-visible:outline-0 ${isFocused ? "bg-gray-100" : "hover:bg-gray-50"}`}
        onClick={onActivate}
        ref={ref}
        role="menuitem"
        tabIndex={tabIndex}
        to={getItemUrl(item)}
      >
        {children}
      </I18nLink>
    )}
    renderTrigger={(isOpen, triggerProps) => (
      <Button {...triggerProps} size="xSmall" variant="tertiary">
        {trigger}
        {items.length > 0 && <ChevronIcon direction={isOpen ? "up" : "down"} />}
      </Button>
    )}
    triggerId={triggerId}
  />
);
