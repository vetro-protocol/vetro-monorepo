import type { Meta, StoryObj } from "@storybook/react";

import { StripedDivider } from "../src/components/stripedDivider";

const meta: Meta<typeof StripedDivider> = {
  component: StripedDivider,
  title: "Earn/StripedDivider",
};

export default meta;
type Story = StoryObj<typeof StripedDivider>;

export const Default: Story = {};
