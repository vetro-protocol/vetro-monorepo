import type { Meta, StoryObj } from "@storybook/react";

import { Tooltip } from "../src/components/tooltip";

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: "Components/Tooltip",
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    children: <span className="text-sm underline">Hover me</span>,
    content: "This is a tooltip",
  },
};

export const WithLongContent: Story = {
  args: {
    children: <span className="text-sm underline">Hover for details</span>,
    content: "This is a longer tooltip with more detailed information",
  },
};

export const WithMultilineContent: Story = {
  args: {
    children: (
      <button className="rounded bg-blue-500 px-3 py-1 text-white">Info</button>
    ),
    content: (
      <div className="flex flex-col gap-1">
        <span>Line 1: First item</span>
        <span>Line 2: Second item</span>
        <span>Line 3: Third item</span>
      </div>
    ),
  },
};

export const OnButton: Story = {
  args: {
    children: (
      <button className="rounded bg-gray-200 px-4 py-2 text-sm font-medium">
        Submit
      </button>
    ),
    content: "Click to submit the form",
  },
};

export const OnIcon: Story = {
  args: {
    children: (
      <span className="flex size-6 items-center justify-center rounded-full bg-gray-100 text-xs">
        ?
      </span>
    ),
    content: "Help information",
  },
};
