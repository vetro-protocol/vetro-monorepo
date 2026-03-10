import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { FilterMenu } from "../src/components/base/filterMenu";

const TableCellsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
    <path
      fill="#6A7282"
      fillRule="evenodd"
      d="M15 11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6ZM7.25 7.5a.5.5 0 0 0-.5-.5H3a.5.5 0 0 0-.5.5V8a.5.5 0 0 0 .5.5h3.75a.5.5 0 0 0 .5-.5v-.5Zm1.5 3a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H9.25a.5.5 0 0 1-.5-.5v-.5ZM13.5 8v-.5A.5.5 0 0 0 13 7H9.25a.5.5 0 0 0-.5.5V8a.5.5 0 0 0 .5.5H13a.5.5 0 0 0 .5-.5Zm-6.75 3.5a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5H3a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h3.75Z"
      clipRule="evenodd"
    />
  </svg>
);

const meta: Meta<typeof FilterMenu> = {
  component: FilterMenu,
  title: "Components/FilterMenu",
};

export default meta;
type Story = StoryObj<typeof FilterMenu>;

const withdrawalSection = {
  label: "View operations from:",
  options: [
    { label: "Pending withdrawals", value: "pending" },
    { label: "Completed withdrawals", value: "completed" },
  ],
};

export const Default: Story = {
  render: function Component() {
    const [selected, setSelected] = useState(["pending", "completed"]);

    return (
      <FilterMenu
        icon={<TableCellsIcon />}
        label="View settings"
        onChange={setSelected}
        sections={[withdrawalSection]}
        selectedValues={selected}
      />
    );
  },
};

export const NoneSelected: Story = {
  render: function Component() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <FilterMenu
        icon={<TableCellsIcon />}
        label="View settings"
        onChange={setSelected}
        sections={[withdrawalSection]}
        selectedValues={selected}
      />
    );
  },
};

export const ManyOptions: Story = {
  render: function Component() {
    const [selected, setSelected] = useState(["pending", "completed"]);

    return (
      <FilterMenu
        icon={<TableCellsIcon />}
        label="View settings"
        onChange={setSelected}
        sections={[
          {
            label: "View operations from:",
            options: [
              { label: "Pending withdrawals", value: "pending" },
              { label: "Completed withdrawals", value: "completed" },
              { label: "Failed transactions", value: "failed" },
              { label: "Processing", value: "processing" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
        ]}
        selectedValues={selected}
      />
    );
  },
};

export const WithMultipleSections: Story = {
  render: function Component() {
    const [selected, setSelected] = useState([
      "borrow",
      "concluded",
      "earn",
      "failed",
      "swap",
    ]);

    return (
      <FilterMenu
        icon={<TableCellsIcon />}
        label="View settings"
        onChange={setSelected}
        sections={[
          {
            label: "View operations from:",
            options: [
              { label: "Borrow", value: "borrow" },
              { label: "Earn", value: "earn" },
              { label: "Swap", value: "swap" },
            ],
          },
          {
            label: "And by status:",
            options: [
              { label: "Success", value: "concluded" },
              { label: "Error", value: "failed" },
            ],
          },
        ]}
        selectedValues={selected}
      />
    );
  },
};
