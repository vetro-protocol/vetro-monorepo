import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../src/components/base/button";

const meta: Meta<typeof Button> = {
  argTypes: {
    children: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    size: {
      control: "select",
      options: ["xSmall", "small", "xLarge"],
    },
  },
  component: Button,
  title: "Components/Button",
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Connected Wallet",
    size: "small",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Connected Wallet",
    size: "xSmall",
    variant: "secondary",
  },
};

export const Tertiary: Story = {
  args: {
    children: "Connected Wallet",
    size: "small",
    variant: "tertiary",
  },
};

export const Danger: Story = {
  args: {
    children: "Delete",
    size: "xSmall",
    variant: "danger",
  },
};
