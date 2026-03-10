import type { Meta, StoryObj } from "@storybook/react";

import { ChevronIcon } from "../src/components/base/chevronIcon";

const meta: Meta<typeof ChevronIcon> = {
  argTypes: {
    direction: {
      control: "select",
      options: ["down", "right", "up"],
    },
  },
  component: ChevronIcon,
  title: "Components/ChevronIcon",
};

export default meta;
type Story = StoryObj<typeof ChevronIcon>;

export const Default: Story = {
  args: {
    direction: "down",
  },
};
