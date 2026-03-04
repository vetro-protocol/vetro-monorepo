import type { Meta, StoryObj } from "@storybook/react";

import { StripedDivider } from "../src/components/stripedDivider";

const meta: Meta<typeof StripedDivider> = {
  component: StripedDivider,
  title: "Components/StripedDivider",
};

export default meta;
type Story = StoryObj<typeof StripedDivider>;

export const Medium: Story = {};

export const Small: Story = {
  args: {
    variant: "small",
  },
};
