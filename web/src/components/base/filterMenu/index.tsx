import { type ReactNode } from "react";

import { ChevronIcon } from "../chevronIcon";
import { Dropdown } from "../dropdown";

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
  const dropdownSections = sections.map((section) => ({
    items: section.options,
    label: section.label,
  }));

  function handleChange(option: FilterOption, selected: boolean) {
    const next = selected
      ? [...selectedValues, option.value]
      : selectedValues.filter((v) => v !== option.value);
    onChange(next);
  }

  return (
    <Dropdown
      getItemKey={(option) => option.value}
      multiSelect
      onChange={handleChange}
      renderItem={(option, isSelected) => (
        <div className="flex items-center gap-2">
          <Checkbox checked={isSelected} />
          {option.label}
        </div>
      )}
      renderTrigger={(isOpen) => (
        <div className="text-xsm flex cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
          {icon}
          {label}
          <ChevronIcon direction={isOpen ? "up" : "down"} />
        </div>
      )}
      sections={dropdownSections}
      selectedValues={selectedValues}
      triggerId={label}
    />
  );
}
