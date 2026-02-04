import type { Meta, StoryObj } from "@storybook/react";

import { MaxButton } from "../src/components/base/maxButton";

const meta: Meta<typeof MaxButton> = {
  component: MaxButton,
  title: "Components/MaxButton",
};

export default meta;
type Story = StoryObj<typeof MaxButton>;

export const Default: Story = {
  args: {
    onClick: () => window.alert("Max clicked"),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onClick: () => window.alert("Max clicked"),
  },
};
