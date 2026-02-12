import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";

import { useMenuPosition } from "../../../hooks/useMenuPosition";
import { ChevronIcon } from "../chevronIcon";

type DropdownProps<T> = {
  getItemKey: (item: T) => string;
  items: T[];
  onChange: (item: T) => void;
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  renderTrigger: (selectedItem: T, isOpen: boolean) => ReactNode;
  triggerId: string;
  value: T;
};

export function Dropdown<T>({
  getItemKey,
  items,
  onChange,
  renderItem,
  renderTrigger,
  triggerId,
  value,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isItemEqual = (a: T, b: T) => getItemKey(a) === getItemKey(b);

  const containerRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsOpen(false),
  );

  useMenuPosition({ isOpen, listRef, matchTriggerWidth: true, triggerRef });

  const canOpenMenu = items.length > 1;

  function handleTriggerClick() {
    if (!canOpenMenu) {
      return;
    }
    setIsOpen(!isOpen);
    setFocusedIndex(-1);
  }

  function handleItemClick(item: T) {
    onChange(item);
    setIsOpen(false);
    triggerRef.current?.focus();
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

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id={triggerId}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="button"
        tabIndex={0}
      >
        <div
          className={`flex ${canOpenMenu ? "cursor-pointer hover:bg-gray-50" : ""} items-center gap-1.5 rounded-full bg-white/5 py-1.5 pr-3 pl-1.5 shadow-sm`}
        >
          {renderTrigger(value, isOpen)}
          {items.length > 1 && (
            <ChevronIcon direction={isOpen ? "up" : "down"} />
          )}
        </div>
      </div>

      {isOpen && (
        <div
          aria-labelledby={triggerId}
          className="fixed z-10 min-w-3xs overflow-y-auto rounded-lg bg-white p-1 shadow-xl"
          ref={listRef}
          role="listbox"
        >
          {items.map(function (item, index) {
            const isSelected = isItemEqual(item, value);
            const isFocused = index === focusedIndex;

            return (
              <div
                aria-selected={isSelected}
                className={`text-xsm flex cursor-pointer items-center rounded px-3 py-2 ${isFocused ? "bg-gray-100" : "hover:bg-gray-50"}`}
                key={getItemKey(item)}
                onClick={() => handleItemClick(item)}
                role="option"
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
