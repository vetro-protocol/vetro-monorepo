import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { useId, useState } from "react";
import { type Address, isAddressEqual } from "viem";

export type MultiSelectOption = {
  label: string;
  value: Address;
};

type Props = {
  label: string;
  onChange: (values: Address[]) => void;
  options: MultiSelectOption[];
  values: Address[];
};

const ChevronDownIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height={16}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 6L8 10L12 6" />
  </svg>
);

export const MultiSelect = function ({
  label,
  onChange,
  options,
  values,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useOnClickOutside<HTMLDivElement>(
    isOpen ? () => setIsOpen(false) : undefined,
  );
  const panelId = useId();

  const isSelected = (value: Address) =>
    values.some((selected) => isAddressEqual(selected, value));

  const toggle = function (value: Address) {
    onChange(
      isSelected(value)
        ? values.filter((selected) => !isAddressEqual(selected, value))
        : [...values, value],
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        className="flex cursor-pointer items-center gap-x-1.5 rounded-md border border-solid border-neutral-300/55 bg-white px-2 py-1 text-sm font-medium text-neutral-600 shadow-xs hover:bg-neutral-50 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={options.length === 0}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {label}
        {values.length > 0 ? (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-1.5 text-xs font-medium text-neutral-950">
            {values.length}
          </span>
        ) : null}
        <ChevronDownIcon />
      </button>

      {isOpen ? (
        <div
          aria-label={label}
          className="absolute z-20 mt-1 max-h-64 w-48 overflow-y-auto rounded-md border border-solid border-neutral-300/55 bg-white p-1 shadow-lg"
          id={panelId}
          role="group"
        >
          {options.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-x-2 rounded-md px-2 py-1.5 text-sm text-neutral-950 hover:bg-neutral-50"
              key={option.value}
            >
              <input
                checked={isSelected(option.value)}
                className="size-4 accent-neutral-900"
                onChange={() => toggle(option.value)}
                type="checkbox"
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))}
          {values.length > 0 ? (
            <button
              className="mt-1 w-full cursor-pointer border-t border-solid border-neutral-200 px-2 pt-1.5 pb-1 text-left text-xs font-medium text-neutral-600 hover:text-neutral-950"
              onClick={() => onChange([])}
              type="button"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
