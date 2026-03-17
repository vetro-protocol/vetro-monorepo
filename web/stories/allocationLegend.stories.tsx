import type { Meta, StoryObj } from "@storybook/react";

import { AllocationLegend } from "../src/pages/analytics/components/allocationCard/allocationLegend";

const meta = {
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
    hoveredLabel: null,
    isError: false,
    isLoading: false,
    items: [
      { amount: 147, color: "bg-emerald-400", label: "Morpho" },
      { amount: 80, color: "bg-blue-400", label: "Aave" },
      { amount: 100, color: "bg-rose-400", label: "Summer.fi" },
      { amount: 64, color: "bg-amber-400", label: "Compound" },
    ],
    onHover: () => undefined,
  },
};
