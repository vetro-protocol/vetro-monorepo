import type { Meta, StoryObj } from "@storybook/react";

import { AllocationCard } from "../src/components/allocationCard";
import { PieChartIcon } from "../src/components/icons/pieChartIcon";
import { YieldDetails, YieldHeader } from "../src/components/yieldCard";
import { DatabaseIcon } from "../src/pages/analytics/icons/databaseIcon";

const meta = {
  component: AllocationCard,
  title: "Analytics/AllocationCard",
} satisfies Meta<typeof AllocationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TVL: Story = {
  args: {
    icon: <DatabaseIcon />,
    isError: false,
    isLoading: false,
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

export const TVLLoading: Story = {
  args: {
    icon: <DatabaseIcon />,
    isError: false,
    isLoading: true,
    items: [],
    label: "Total Value Locked (TVL)",
    value: "",
  },
};

export const TVLError: Story = {
  args: {
    icon: <DatabaseIcon />,
    isError: true,
    isLoading: false,
    items: [],
    label: "Total Value Locked (TVL)",
    value: "",
  },
};

export const YieldAllocation: Story = {
  args: {
    footnote:
      "Projection based on current balances and APYs. Actual yield will vary as rates and allocations change.",
    header: <YieldHeader />,
    icon: <PieChartIcon />,
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
    label: "Yield allocation",
    value: "8 protocols",
  },
};
