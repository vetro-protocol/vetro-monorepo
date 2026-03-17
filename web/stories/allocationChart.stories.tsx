import type { Meta, StoryObj } from "@storybook/react";

import { AllocationChart } from "../src/pages/analytics/components/allocationCard/allocationChart";

const meta = {
  component: AllocationChart,
  title: "Analytics/AllocationChart",
} satisfies Meta<typeof AllocationChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TVL: Story = {
  args: {
    hoveredLabel: null,
    items: [
      { amount: 37_500_000, color: "bg-blue-400", label: "USDT" },
      { amount: 37_500_000, color: "bg-emerald-400", label: "USDC" },
      { amount: 37_500_000, color: "bg-amber-400", label: "DAI" },
      { amount: 12_500_000, color: "bg-rose-400", label: "HemiBTC CDPs" },
    ],
    onHover: () => undefined,
  },
};

export const YieldAllocation: Story = {
  args: {
    hoveredLabel: null,
    items: [
      { amount: 147, color: "bg-emerald-400", label: "Morpho" },
      { amount: 80, color: "bg-blue-400", label: "Aave" },
      { amount: 100, color: "bg-rose-400", label: "Summer.fi" },
      { amount: 64, color: "bg-amber-400", label: "Compound" },
    ],
    onHover: () => undefined,
  },
};
