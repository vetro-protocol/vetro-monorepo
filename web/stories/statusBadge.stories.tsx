import type { Meta, StoryObj } from "@storybook/react";

import { StatusBadge } from "../src/components/base/statusBadge";

const meta: Meta<typeof StatusBadge> = {
  argTypes: {
    variant: {
      control: "select",
      options: ["cooldown", "ready", "withdrawn"],
    },
  },
  component: StatusBadge,
  title: "Components/StatusBadge",
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Cooldown: Story = {
  args: {
    children: "Cooldown in progress",
    variant: "cooldown",
  },
};

export const Ready: Story = {
  args: {
    children: "Ready to withdraw",
    variant: "ready",
  },
};

export const Withdrawn: Story = {
  args: {
    children: "Withdrawn",
    variant: "withdrawn",
  },
};
