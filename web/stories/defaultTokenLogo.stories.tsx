import type { Meta, StoryObj } from "@storybook/react";

import { DefaultTokenLogo } from "../src/components/defaultTokenLogo";

const meta: Meta<typeof DefaultTokenLogo> = {
  args: {
    size: "base",
    symbol: "VUSD",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["base", "large", "small", "xLarge"],
    },
  },
  component: DefaultTokenLogo,
  title: "Components/DefaultTokenLogo",
};

export default meta;
type Story = StoryObj<typeof DefaultTokenLogo>;

export const Base: Story = {
  args: { size: "base" },
};

export const Small: Story = {
  args: { size: "small" },
};

export const Large: Story = {
  args: { size: "large" },
};

export const XLarge: Story = {
  args: { size: "xLarge" },
};
