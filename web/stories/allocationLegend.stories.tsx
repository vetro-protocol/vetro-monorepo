import type { Meta, StoryObj } from "@storybook/react";

import { AllocationLegend } from "../src/components/allocationCard/allocationLegend";
import { YieldDetails, YieldHeader } from "../src/components/yieldCard";
import { formatUsd } from "../src/utils/currency";

const meta = {
  args: {
    formatAmount: formatUsd,
  },
  component: AllocationLegend,
  title: "Analytics/AllocationLegend",
} satisfies Meta<typeof AllocationLegend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TVL: Story = {
  args: {
    hoveredLabel: null,
    isError: false,
    isLoading: false,
    items: [
      { amount: 37_500_000, color: "bg-blue-400", label: "USDT" },
      { amount: 37_500_000, color: "bg-emerald-400", label: "USDC" },
      { amount: 37_500_000, color: "bg-amber-400", label: "DAI" },
      { amount: 12_500_000, color: "bg-rose-400", label: "HemiBTC CDPs" },
    ],
    onHover: () => undefined,
  },
};

export const Loading: Story = {
  args: {
    hoveredLabel: null,
    isError: false,
    isLoading: true,
    items: [],
    onHover: () => undefined,
  },
};

export const Error: Story = {
  args: {
    hoveredLabel: null,
    isError: true,
    isLoading: false,
    items: [],
    onHover: () => undefined,
  },
};

export const YieldAllocation: Story = {
  args: {
    header: <YieldHeader />,
    hoveredLabel: null,
    isError: false,
    isLoading: false,
    items: [
      {
        amount: 147,
        color: "bg-emerald-400",
        details: <YieldDetails amount={147} apy={6.13} />,
        label: "Morpho",
      },
      {
        amount: 100,
        color: "bg-rose-400",
        details: <YieldDetails amount={100} apy={3.62} />,
        label: "Summer.fi",
      },
      {
        amount: 80,
        color: "bg-blue-400",
        details: <YieldDetails amount={80} apy={4.24} />,
        label: "Aave",
      },
      {
        amount: 64,
        color: "bg-amber-400",
        details: <YieldDetails amount={64} apy={undefined} />,
        label: "Compound",
      },
    ],
    onHover: () => undefined,
  },
};
