import type { Meta, StoryObj } from "@storybook/react";

import { PoolInfoItem } from "../src/pages/earn/components/poolInfoBar/poolInfoItem";
import { TokenIconStack } from "../src/pages/earn/components/poolInfoBar/tokenIconStack";

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
    label: "Total deposits",
  },
};

export const WithValue: Story = {
  args: {
    label: "Total deposits",
    value: "$268.24M",
  },
};

export const WithChildren: Story = {
  args: {
    label: "Potential rewards",
  },
  render: (args) => (
    <PoolInfoItem {...args}>
      <TokenIconStack
        tokens={[{ symbol: "Morpho" }, { symbol: "Gon" }, { symbol: "USDC" }]}
      />
    </PoolInfoItem>
  ),
};

export const WithApyAndTokens: Story = {
  args: {
    label: "Current 7-Day APY",
  },
  render: (args) => (
    <PoolInfoItem {...args}>
      <div className="flex items-center gap-1">
        <span className="text-xsm font-semibold text-gray-900">5.39%</span>
        <TokenIconStack
          tokens={[{ symbol: "Morpho" }, { symbol: "Gon" }, { symbol: "USDC" }]}
        />
      </div>
    </PoolInfoItem>
  ),
};

export const EmptyTokens: Story = {
  args: {
    label: "Potential rewards",
  },
  render: (args) => (
    <PoolInfoItem {...args}>
      <TokenIconStack tokens={[]} />
    </PoolInfoItem>
  ),
};
