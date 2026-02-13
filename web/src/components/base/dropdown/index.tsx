import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { useMenuPosition } from "../../../hooks/useMenuPosition";

type BaseProps<T> = {
  getItemKey: (item: T) => string;
  items: T[];
  matchTriggerWidth?: boolean;
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  renderTrigger: (isOpen: boolean) => ReactNode;
  triggerId: string;
};

type SingleSelectProps<T> = BaseProps<T> & {
  multiSelect?: false;
  onChange: (item: T) => void;
  value: T;
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
    items,
    matchTriggerWidth = false,
    renderItem,
    renderTrigger,
    triggerId,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const containerRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsOpen(false),
  );

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
    return getItemKey(item) === getItemKey(props.value);
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
  const listRole = multi ? "menu" : "listbox";
  const itemRole = multi ? "menuitemcheckbox" : "option";

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        aria-expanded={isOpen}
        aria-haspopup={multi ? "true" : "listbox"}
        id={triggerId}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="button"
        tabIndex={0}
      >
        {renderTrigger(isOpen)}
      </div>

      {isOpen && (
        <div
          aria-labelledby={triggerId}
          className="fixed z-10 min-w-3xs overflow-y-auto rounded-lg bg-white p-1 shadow-xl"
          ref={listRef}
          role={listRole}
        >
          {items.map(function (item, index) {
            const isSelected = isItemSelected(item);
            const isFocused = index === focusedIndex;

            return (
              <div
                {...(multi
                  ? { "aria-checked": isSelected }
                  : { "aria-selected": isSelected })}
                className={`text-xsm flex cursor-pointer items-center rounded px-3 py-2 ${isFocused ? "bg-gray-100" : "hover:bg-gray-50"}`}
                key={getItemKey(item)}
                onClick={() => handleItemClick(item)}
                role={itemRole}
              >
                <div className="flex w-full items-center justify-between gap-2 font-medium text-gray-900">
                  {renderItem(item, isSelected)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
