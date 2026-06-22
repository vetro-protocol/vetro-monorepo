import type { Meta, StoryObj } from "@storybook/react";

import { PoolInfoItem } from "../src/pages/earn/components/poolInfoBar/poolInfoItem";

const meta: Meta<typeof PoolInfoItem> = {
  component: PoolInfoItem,
  title: "Earn/PoolInfoItem",
};

export default meta;
type Story = StoryObj<typeof PoolInfoItem>;

export const Default: Story = {
  args: {
    label: "Pool contract",
    value: "0xdcfe...b5f9",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    label: "Pool deposits",
  },
};

export const WithValue: Story = {
  args: {
    label: "Pool deposits",
    value: "$268.24M",
  },
};

export const WithChildren: Story = {
  args: {
    label: "Pool contract",
  },
  render: (args) => (
    <PoolInfoItem {...args}>
      <a
        className="text-xsm font-semibold text-orange-500 hover:underline"
        href="https://etherscan.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        0xdcfe...b5f9
      </a>
    </PoolInfoItem>
  ),
};
