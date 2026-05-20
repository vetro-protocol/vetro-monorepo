import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router";

import { Button } from "../src/components/base/button";
import { ChevronIcon } from "../src/components/base/chevronIcon";
import { Dropdown } from "../src/components/base/dropdown";
import { I18nLink } from "../src/components/base/i18nLink";

type Fruit = { label: string; value: string };

const fruits: Fruit[] = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
  { label: "Date", value: "date" },
];

const meta = {
  component: Dropdown,
  title: "Components/Dropdown",
} satisfies Meta<typeof Dropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

const TriggerButton = ({
  isOpen,
  label,
  triggerProps,
}: {
  isOpen: boolean;
  label: string;
  triggerProps: Parameters<
    Parameters<typeof Dropdown<Fruit>>[0]["renderTrigger"]
  >[1];
}) => (
  <Button {...triggerProps} size="small" variant="secondary">
    {label}
    <ChevronIcon direction={isOpen ? "up" : "down"} />
  </Button>
);

export const SingleSelect: Story = {
  // @ts-expect-error story owns the args at runtime
  args: {},
  render: function Render() {
    const [value, setValue] = useState<Fruit>(fruits[0]);

    return (
      <Dropdown<Fruit>
        getItemKey={(item) => item.value}
        items={fruits}
        onChange={setValue}
        renderItem={(item) => <span>{item.label}</span>}
        renderTrigger={(isOpen, triggerProps) => (
          <TriggerButton
            isOpen={isOpen}
            label={value.label}
            triggerProps={triggerProps}
          />
        )}
        triggerId="dropdown-single-select"
        value={value}
      />
    );
  },
};

export const MultiSelect: Story = {
  // @ts-expect-error story owns the args at runtime
  args: {},
  render: function Render() {
    const [selectedValues, setSelectedValues] = useState<string[]>([
      "apple",
      "cherry",
    ]);

    function handleChange(item: Fruit, selected: boolean) {
      setSelectedValues((prev) =>
        selected ? [...prev, item.value] : prev.filter((v) => v !== item.value),
      );
    }

    return (
      <Dropdown<Fruit>
        getItemKey={(item) => item.value}
        items={fruits}
        multiSelect
        onChange={handleChange}
        renderItem={(item, isSelected) => (
          <span className="flex items-center gap-2">
            <span
              className={`flex size-4 items-center justify-center rounded border ${
                isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
              }`}
            >
              {isSelected && (
                <span className="text-xs leading-none text-white">✓</span>
              )}
            </span>
            {item.label}
          </span>
        )}
        renderTrigger={(isOpen, triggerProps) => (
          <TriggerButton
            isOpen={isOpen}
            label={`${selectedValues.length} selected`}
            triggerProps={triggerProps}
          />
        )}
        selectedValues={selectedValues}
        triggerId="dropdown-multi-select"
      />
    );
  },
};

export const WithSections: Story = {
  // @ts-expect-error story owns the args at runtime
  args: {},
  render: function Render() {
    const [value, setValue] = useState<Fruit>(fruits[0]);

    const sections = [
      {
        items: [fruits[0], fruits[1]],
        label: "Pome",
      },
      {
        items: [fruits[2], fruits[3]],
        label: "Stone",
      },
    ];

    return (
      <Dropdown<Fruit>
        getItemKey={(item) => item.value}
        onChange={setValue}
        renderItem={(item) => <span>{item.label}</span>}
        renderTrigger={(isOpen, triggerProps) => (
          <TriggerButton
            isOpen={isOpen}
            label={value.label}
            triggerProps={triggerProps}
          />
        )}
        sections={sections}
        triggerId="dropdown-with-sections"
        value={value}
      />
    );
  },
};

export const MatchTriggerWidth: Story = {
  // @ts-expect-error story owns the args at runtime
  args: {},
  render: function Render() {
    const [value, setValue] = useState<Fruit>(fruits[0]);

    return (
      <div className="w-80">
        <Dropdown<Fruit>
          getItemKey={(item) => item.value}
          items={fruits}
          matchTriggerWidth
          onChange={setValue}
          renderItem={(item) => <span>{item.label}</span>}
          renderTrigger={(isOpen, triggerProps) => (
            <button
              {...triggerProps}
              className="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {value.label}
              <ChevronIcon direction={isOpen ? "up" : "down"} />
            </button>
          )}
          triggerId="dropdown-match-trigger-width"
          value={value}
        />
      </div>
    );
  },
};

type NavItem = { label: string; to: string };

const navItems: NavItem[] = [
  { label: "Borrow", to: "/borrow" },
  { label: "Earn", to: "/earn" },
  { label: "Swap", to: "/swap" },
];

export const Navigation: Story = {
  // @ts-expect-error story owns the args at runtime
  args: {},
  decorators: [
    (StoryComponent) => (
      <MemoryRouter initialEntries={["/en"]}>
        <Routes>
          <Route element={<StoryComponent />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    ),
  ],
  render: () => (
    <Dropdown<NavItem>
      getItemKey={(item) => item.to}
      items={navItems}
      renderItem={(item) => <span>{item.label}</span>}
      renderItemWrapper={(
        { isFocused, item, onActivate, ref, tabIndex },
        children,
      ) => (
        <I18nLink
          className={`text-xsm flex w-full items-center rounded px-3 py-2 font-medium text-gray-900 focus-visible:outline-0 ${isFocused ? "bg-gray-100" : "hover:bg-gray-50"}`}
          onClick={onActivate}
          ref={ref}
          role="menuitem"
          tabIndex={tabIndex}
          to={item.to}
        >
          {children}
        </I18nLink>
      )}
      renderTrigger={(isOpen, triggerProps) => (
        <Button {...triggerProps} size="small" variant="secondary">
          Navigate
          <ChevronIcon direction={isOpen ? "up" : "down"} />
        </Button>
      )}
      triggerId="dropdown-navigation"
    />
  ),
};
