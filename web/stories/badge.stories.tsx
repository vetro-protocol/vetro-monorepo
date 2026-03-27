import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "../src/components/base/badge";

const meta: Meta<typeof Badge> = {
  argTypes: {
    variant: {
      control: "select",
      options: ["blue", "gray", "red"],
    },
  },
  component: Badge,
  title: "Components/Badge",
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Blue: Story = {
  args: {
    children: "0.50 VUSD",
    variant: "blue",
  },
};

export const Gray: Story = {
  args: {
    children: "Default",
    variant: "gray",
  },
};

export const Red: Story = {
  args: {
    children: "HemiBTC / VUSD",
    variant: "red",
  },
};
