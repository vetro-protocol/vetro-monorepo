import { type ReactNode } from "react";

import { Checkbox } from "../checkbox";
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
          <Checkbox
            aria-hidden="true"
            checked={isSelected}
            // The dropdown item handles the toggle; readOnly only silences React's controlled-input warning
            readOnly
            tabIndex={-1}
          />
          {option.label}
        </div>
      )}
      renderTrigger={(isOpen, triggerProps) => (
        <div
          {...triggerProps}
          className="text-xsm flex cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
        >
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
