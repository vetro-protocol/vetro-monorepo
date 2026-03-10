import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { type ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useMenuPosition } from "../../../hooks/useMenuPosition";
import { ChevronIcon } from "../chevronIcon";

type FilterOption = {
  label: string;
  value: string;
};

type FilterSection = {
  label: string;
  options: FilterOption[];
};

type Props = {
  icon?: ReactNode;
  label: string;
  onChange: (selectedValues: string[]) => void;
  sections: FilterSection[];
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

const Checkbox = ({ checked }: { checked: boolean }) => (
  <span
    className={`flex size-4 shrink-0 items-center justify-center rounded ${
      checked ? "bg-blue-500" : "bg-white shadow-sm"
    }`}
  >
    {checked && <CheckIcon />}
  </span>
);

export function FilterMenu({
  icon,
  label,
  onChange,
  sections,
  selectedValues,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const containerRef = useOnClickOutside<HTMLDivElement>(function (e) {
    if (listRef.current?.contains(e.target as Node)) {
      return;
    }
    setIsOpen(false);
  });

  useMenuPosition({ isOpen, listRef, triggerRef });

  function handleOptionClick(option: FilterOption) {
    const isSelected = selectedValues.includes(option.value);
    const next = isSelected
      ? selectedValues.filter((v) => v !== option.value)
      : [...selectedValues, option.value];
    onChange(next);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        role="button"
        tabIndex={0}
      >
        <div className="text-xsm flex cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
          {icon}
          {label}
          <ChevronIcon direction={isOpen ? "up" : "down"} />
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            aria-labelledby="filter-menu"
            className="fixed z-30 min-w-3xs overflow-y-auto rounded-lg bg-white p-1 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            ref={listRef}
            role="menu"
          >
            {sections.map((section) => (
              <div key={section.label}>
                <div
                  className="text-xsm px-3 py-2 font-medium text-gray-500"
                  role="presentation"
                >
                  {section.label}
                </div>
                {section.options.map(function (option) {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <div
                      aria-checked={isSelected}
                      className="text-xsm flex cursor-pointer items-center rounded px-3 py-2 hover:bg-gray-50"
                      key={option.value}
                      onClick={() => handleOptionClick(option)}
                      role="menuitemcheckbox"
                    >
                      <div className="flex w-full items-center justify-between gap-2 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isSelected} />
                          {option.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
