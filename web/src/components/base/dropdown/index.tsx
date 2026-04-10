import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { useMenuPosition } from "../../../hooks/useMenuPosition";

type DropdownSection<T> = {
  items: T[];
  label: string;
};

type TriggerProps = {
  "aria-expanded": boolean;
  "aria-haspopup": "listbox" | "menu";
  id: string;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  ref: (node: HTMLElement | null) => void;
  role: "button";
  tabIndex: 0;
};

type BaseProps<T> = {
  getItemKey: (item: T) => string;
  items?: T[];
  matchTriggerWidth?: boolean;
  menuLabel?: string;
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  renderTrigger: (isOpen: boolean, triggerProps: TriggerProps) => ReactNode;
  sections?: DropdownSection<T>[];
  triggerId: string;
};

type SingleSelectProps<T> = BaseProps<T> & {
  multiSelect?: false;
  onChange: (item: T) => void;
  value?: T;
};

type MultiSelectProps<T> = BaseProps<T> & {
  multiSelect: true;
  onChange: (item: T, selected: boolean) => void;
  selectedValues: string[];
};

type DropdownProps<T> = MultiSelectProps<T> | SingleSelectProps<T>;

const isMultiSelect = <T,>(
  props: DropdownProps<T>,
): props is MultiSelectProps<T> => props.multiSelect === true;

export function Dropdown<T>(props: DropdownProps<T>) {
  const {
    getItemKey,
    items: itemsProp,
    matchTriggerWidth = false,
    menuLabel,
    renderItem,
    renderTrigger,
    sections,
    triggerId,
  } = props;

  const items = sections ? sections.flatMap((s) => s.items) : (itemsProp ?? []);

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const containerRef = useOnClickOutside<HTMLDivElement>(function (e) {
    // The list is portaled to document.body, so it's not a DOM child
    // of the container. Ignore clicks inside the portaled list.
    if (listRef.current?.contains(e.target as Node)) {
      return;
    }
    setIsOpen(false);
  });

  useMenuPosition({ isOpen, listRef, triggerRef });

  useEffect(
    function applyTriggerWidth() {
      if (
        !matchTriggerWidth ||
        !isOpen ||
        !triggerRef.current ||
        !listRef.current
      ) {
        return;
      }
      const triggerRect = triggerRef.current.getBoundingClientRect();
      listRef.current.style.width = `${triggerRect.width}px`;
    },
    [isOpen, matchTriggerWidth],
  );

  function isItemSelected(item: T) {
    if (isMultiSelect(props)) {
      return props.selectedValues.includes(getItemKey(item));
    }
    return (
      props.value !== undefined && getItemKey(item) === getItemKey(props.value)
    );
  }

  const canOpenMenu = items.length > 1;

  function handleTriggerClick() {
    if (!canOpenMenu) {
      return;
    }
    setIsOpen(!isOpen);
    setFocusedIndex(-1);
  }

  function handleItemClick(item: T) {
    if (isMultiSelect(props)) {
      const selected = !isItemSelected(item);
      props.onChange(item, selected);
    } else {
      props.onChange(item);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }

  function handleItemKeyDown(event: KeyboardEvent, item: T) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleItemClick(item);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev === -1 ? 0 : prev < items.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          handleItemClick(items[focusedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }

  const multi = isMultiSelect(props);
  const hasSelection = !multi && props.value !== undefined;
  const listRole = hasSelection ? "listbox" : "menu";
  const itemRole = multi
    ? "menuitemcheckbox"
    : hasSelection
      ? "option"
      : "menuitem";

  return (
    <div className="relative inline-block" ref={containerRef}>
      {renderTrigger(isOpen, {
        "aria-expanded": isOpen,
        "aria-haspopup": listRole,
        id: triggerId,
        onClick: handleTriggerClick,
        onKeyDown: handleKeyDown,
        ref(node: HTMLElement | null) {
          triggerRef.current = node;
        },
        role: "button",
        tabIndex: 0,
      })}

      {isOpen &&
        createPortal(
          <div
            aria-labelledby={triggerId}
            className="fixed z-30 min-w-3xs overflow-y-auto rounded-lg bg-white p-1 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            ref={listRef}
            role={listRole}
          >
            {menuLabel && (
              <div
                className="text-xsm px-3 py-2 font-medium text-gray-500"
                role="presentation"
              >
                {menuLabel}
              </div>
            )}
            {sections
              ? sections.map((section) => (
                  <div key={section.label}>
                    <div
                      className="text-xsm px-3 py-2 font-medium text-gray-500"
                      role="presentation"
                    >
                      {section.label}
                    </div>
                    {section.items.map(function (item) {
                      const index = items.indexOf(item);
                      const isSelected = isItemSelected(item);
                      const isFocused = index === focusedIndex;
                      return (
                        <div
                          {...(multi
                            ? { "aria-checked": isSelected }
                            : hasSelection
                              ? { "aria-selected": isSelected }
                              : {})}
                          className={`text-xsm flex cursor-pointer items-center rounded px-3 py-2 ${isFocused ? "bg-gray-100" : "hover:bg-gray-50"}`}
                          key={getItemKey(item)}
                          onClick={() => handleItemClick(item)}
                          onKeyDown={(e) => handleItemKeyDown(e, item)}
                          role={itemRole}
                          tabIndex={-1}
                        >
                          <div className="flex w-full items-center justify-between gap-2 font-medium text-gray-900">
                            {renderItem(item, isSelected)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              : items.map(function (item, index) {
                  const isSelected = isItemSelected(item);
                  const isFocused = index === focusedIndex;

                  return (
                    <div
                      {...(multi
                        ? { "aria-checked": isSelected }
                        : hasSelection
                          ? { "aria-selected": isSelected }
                          : {})}
                      className={`text-xsm group/item flex cursor-pointer items-center rounded px-3 py-2 ${isFocused ? "bg-gray-100" : "hover:bg-gray-50"}`}
                      key={getItemKey(item)}
                      onClick={() => handleItemClick(item)}
                      onKeyDown={(e) => handleItemKeyDown(e, item)}
                      role={itemRole}
                      tabIndex={-1}
                    >
                      <div className="flex w-full items-center justify-between gap-2 font-medium text-gray-900">
                        {renderItem(item, isSelected)}
                      </div>
                    </div>
                  );
                })}
          </div>,
          document.body,
        )}
    </div>
  );
}
