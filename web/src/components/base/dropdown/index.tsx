import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { useWindowSize } from "@hemilabs/react-hooks/useWindowSize";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

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
  const { height: windowHeight, width: windowWidth } = useWindowSize();

  const isItemEqual = (a: T, b: T) => getItemKey(a) === getItemKey(b);

  const containerRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsOpen(false),
  );

  // Position dropdown based on viewport
  useEffect(
    function positionDropdownOnScreen() {
      if (!isOpen || !triggerRef.current || !listRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const listRect = listRef.current.getBoundingClientRect();
      const gap = 8;

      // Vertical positioning
      const spaceBelow = windowHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let top: number;
      if (spaceBelow >= listRect.height || spaceBelow > spaceAbove) {
        top = triggerRect.bottom + gap;
      } else {
        top = triggerRect.top - listRect.height - gap;
      }

      // Horizontal positioning
      const spaceRight = windowWidth - triggerRect.left;
      const spaceLeft = triggerRect.right;

      let left: number;
      if (spaceRight >= listRect.width || spaceRight > spaceLeft) {
        // Align to left edge of trigger
        left = triggerRect.left;
      } else {
        // Align to right edge of trigger
        left = triggerRect.right - listRect.width;
      }

      // Ensure the menu doesn't go off-screen
      left = Math.max(gap, Math.min(left, windowWidth - listRect.width - gap));
      top = Math.max(gap, Math.min(top, windowHeight - listRect.height - gap));

      listRef.current.style.top = `${top}px`;
      listRef.current.style.left = `${left}px`;
      listRef.current.style.width = `${triggerRect.width}px`;
    },
    [isOpen, windowHeight, windowWidth],
  );

  function handleTriggerClick() {
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
        setFocusedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
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
        <div className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/5 py-1.5 pr-3 pl-1.5 shadow-sm hover:bg-gray-50">
          {renderTrigger(value, isOpen)}
          <ChevronIcon direction={isOpen ? "up" : "down"} />
        </div>
      </div>

      {isOpen && (
        <div
          aria-labelledby={triggerId}
          className="fixed z-10 min-w-3xs overflow-y-auto rounded-lg bg-white p-1 shadow-xl"
          ref={listRef}
          role="listbox"
        >
          {items.map(function (item) {
            const isSelected = isItemEqual(item, value);

            return (
              <div
                aria-selected={isSelected}
                className={
                  "text-xsm flex cursor-pointer items-center px-3 py-2 hover:rounded hover:bg-gray-50"
                }
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
