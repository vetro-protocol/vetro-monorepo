import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "../src/components/base/badge";

const meta: Meta<typeof Badge> = {
  args: {
    hoverable: false,
  },
  argTypes: {
    hoverable: {
      control: "boolean",
    },
    variant: {
      control: "select",
      options: ["blue", "gray", "green", "light-red", "red"],
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

export const Green: Story = {
  args: {
    children: "Active",
    variant: "green",
  },
};

export const LightRed: Story = {
  args: {
    children: "Warning",
    variant: "light-red",
  },
};

export const Red: Story = {
  args: {
    children: "HemiBTC / VUSD",
    variant: "red",
  },
};
