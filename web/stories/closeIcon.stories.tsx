import type { Meta, StoryObj } from "@storybook/react";

import { CloseIcon } from "../src/components/icons/closeIcon";

const meta: Meta<typeof CloseIcon> = {
  argTypes: {
    size: {
      control: "select",
      options: ["small", "medium"],
    },
  },
  component: CloseIcon,
  title: "Icons/CloseIcon",
};

export default meta;
type Story = StoryObj<typeof CloseIcon>;

export const Medium: Story = {};

export const Small: Story = {
  args: {
    size: "small",
  },
};

export const InheritsColorFromParent: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <span className="text-gray-500">
        <CloseIcon size="small" />
      </span>
      <span className="text-blue-500">
        <CloseIcon />
      </span>
      <span className="text-red-500">
        <CloseIcon />
      </span>
    </div>
  ),
};
