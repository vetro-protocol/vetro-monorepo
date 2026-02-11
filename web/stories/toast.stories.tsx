import type { Meta, StoryObj } from "@storybook/react";

import { Toast } from "../src/components/base/toast";

const meta: Meta<typeof Toast> = {
  component: Toast,
  parameters: {
    layout: "fullscreen",
  },
  title: "Components/Toast",
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const WithDescription: Story = {
  args: {
    description: "Your funds are now staked and earning yield.",
    title: "Stake deposit confirmed",
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Stake deposit confirmed",
  },
};

export const Closable: Story = {
  args: {
    closable: true,
    title: "Stake deposit confirmed",
  },
};

export const ClosableWithDescription: Story = {
  args: {
    closable: true,
    description: "Your 7-day cooldown has started.",
    title: "Withdrawal request confirmed",
  },
};
