import type { Meta, StoryObj } from "@storybook/react";

import { NetRevenueContent } from "../src/components/netRevenueCard";

const meta = {
  component: NetRevenueContent,
  title: "Analytics/NetRevenueCard",
} satisfies Meta<typeof NetRevenueContent>;

export default meta;

type Story = StoryObj<typeof meta>;

const stakerValues = {
  staked: 115_850,
  stakerApy: 10.51,
  stakerPayouts: 12_175.84,
};

export const NetPositive: Story = {
  args: {
    isError: false,
    isLoading: false,
    shareSymbol: "sVUSD",
    values: {
      ...stakerValues,
      backendApy: 4.87,
      backendBalance: 665_790,
      backendYield: 32_434.27,
      netRevenue: 20_258.43,
    },
  },
};

export const NetNegative: Story = {
  args: {
    ...NetPositive.args,
    values: {
      ...stakerValues,
      backendApy: 4.87,
      backendBalance: 166_740,
      backendYield: 8_120.24,
      netRevenue: -4_055.6,
    },
  },
};

export const Breakeven: Story = {
  args: {
    ...NetPositive.args,
    values: {
      ...stakerValues,
      backendApy: 4.87,
      backendBalance: 250_100,
      backendYield: 12_175.84,
      netRevenue: 0,
    },
  },
};

export const UnknownBackendYield: Story = {
  args: {
    ...NetPositive.args,
    values: {
      ...stakerValues,
      backendApy: null,
      backendBalance: 665_790,
      backendYield: null,
      netRevenue: null,
    },
  },
};

export const Loading: Story = {
  args: {
    isError: false,
    isLoading: true,
    shareSymbol: undefined,
    values: undefined,
  },
};

export const Error: Story = {
  args: {
    isError: true,
    isLoading: false,
    shareSymbol: undefined,
    values: undefined,
  },
};
