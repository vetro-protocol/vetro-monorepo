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

type FilterOption = {
  label: string;
  value: string;
};

type Props = {
  icon?: ReactNode;
  label: string;
  onChange: (selectedValues: string[]) => void;
  options: FilterOption[];
  selectedValues: string[];
};

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
    <g clipPath="url(#a65445a)">
      <rect width={16} height={16} fill="#416BFF" rx={4} />
      <path
        fill="#EAF4FF"
        fillRule="evenodd"
        d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.739a.75.75 0 0 1 1.04-.208Z"
        clipRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="a65445a">
        <rect width={16} height={16} fill="#fff" rx={4} />
      </clipPath>
    </defs>
  </svg>
);

export function FilterMenu({
  icon,
  label,
  onChange,
  options,
  selectedValues,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { height: windowHeight, width: windowWidth } = useWindowSize();

  const containerRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsOpen(false),
  );

  useEffect(
    function positionMenuOnScreen() {
      if (!isOpen || !triggerRef.current || !listRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const listRect = listRef.current.getBoundingClientRect();
      const gap = 8;

      const spaceBelow = windowHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let top: number;
      if (spaceBelow >= listRect.height || spaceBelow > spaceAbove) {
        top = triggerRect.bottom + gap;
      } else {
        top = triggerRect.top - listRect.height - gap;
      }

      const spaceRight = windowWidth - triggerRect.left;
      const spaceLeft = triggerRect.right;

      let left: number;
      if (spaceRight >= listRect.width || spaceRight > spaceLeft) {
        left = triggerRect.left;
      } else {
        left = triggerRect.right - listRect.width;
      }

      left = Math.max(gap, Math.min(left, windowWidth - listRect.width - gap));
      top = Math.max(gap, Math.min(top, windowHeight - listRect.height - gap));

      listRef.current.style.top = `${top}px`;
      listRef.current.style.left = `${left}px`;
    },
    [isOpen, windowHeight, windowWidth],
  );

  function handleToggle(value: string) {
    const isSelected = selectedValues.includes(value);
    const next = isSelected
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(next);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div
      className="relative inline-block"
      onKeyDown={handleKeyDown}
      ref={containerRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="text-xsm flex cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1.5 font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
        ref={triggerRef}
        type="button"
      >
        {icon}
        {label}
        <ChevronIcon direction={isOpen ? "up" : "down"} />
      </button>

      {isOpen && (
        <div
          className="fixed z-10 overflow-y-auto rounded-lg bg-white p-1 shadow-xl"
          ref={listRef}
          role="menu"
        >
          {options.map(function (option) {
            const isSelected = selectedValues.includes(option.value);
            return (
              <button
                className="text-xsm flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 font-medium text-gray-900 hover:bg-gray-50"
                key={option.value}
                onClick={() => handleToggle(option.value)}
                role="menuitemcheckbox"
                type="button"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded ${
                    isSelected ? "bg-blue-500" : "bg-white shadow-sm"
                  }`}
                >
                  {isSelected && <CheckIcon />}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
