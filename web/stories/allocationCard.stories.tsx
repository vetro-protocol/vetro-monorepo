import type { Meta, StoryObj } from "@storybook/react";

import { AllocationCard } from "../src/pages/analytics/components/allocationCard";
import { DatabaseIcon } from "../src/pages/analytics/icons/databaseIcon";
import { PieChartIcon } from "../src/pages/analytics/icons/pieChartIcon";

const meta = {
  component: AllocationCard,
  title: "Analytics/AllocationCard",
} satisfies Meta<typeof AllocationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TVL: Story = {
  args: {
    icon: <DatabaseIcon />,
    items: [
      { amount: 37_500_000, color: "bg-blue-400", label: "USDT" },
      { amount: 37_500_000, color: "bg-emerald-400", label: "USDC" },
      { amount: 37_500_000, color: "bg-amber-400", label: "DAI" },
      { amount: 12_500_000, color: "bg-rose-400", label: "HemiBTC CDPs" },
    ],
    label: "Total Value Locked (TVL)",
    value: "$125,000,000.00",
  },
};

export const YieldAllocation: Story = {
  args: {
    icon: <PieChartIcon />,
    items: [
      { amount: 147, color: "bg-emerald-400", label: "Morpho" },
      { amount: 80, color: "bg-blue-400", label: "Aave" },
      { amount: 100, color: "bg-rose-400", label: "Summer.fi" },
      { amount: 64, color: "bg-amber-400", label: "Compound" },
    ],
    label: "Yield allocation",
    value: "8 protocols",
  },
};
