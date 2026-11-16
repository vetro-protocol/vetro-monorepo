import type { Meta, StoryObj } from "@storybook/react";

import { AllocationCard } from "../src/components/allocationCard";
import { PieChartIcon } from "../src/components/icons/pieChartIcon";
import {
  YieldDetails,
  YieldHeader,
  YieldTotal,
} from "../src/components/yieldCard";
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

const strategies = [
  {
    amount: 147,
    apy: 6.13,
    color: "bg-emerald-400",
    href: "https://app.morpho.org/ethereum/vault/0x23f5E9c35820f4baB695Ac1F19c203cC3f8e1e11",
    label: "Morpho",
  },
  {
    amount: 100,
    apy: 3.62,
    color: "bg-rose-400",
    href: "https://app.lagoon.finance/vault/1/0x08D97f1B434d9e164218ee1DD9611290dA238b79",
    label: "Summer.fi",
  },
  {
    amount: 80,
    apy: 4.24,
    color: "bg-blue-400",
    label: "Aave",
  },
  {
    amount: 64,
    apy: undefined,
    color: "bg-amber-400",
    label: "Compound",
  },
];

const toYieldStoryArgs = (items: typeof strategies) => ({
  footer: <YieldTotal items={items} />,
  items: items.map(({ amount, apy, ...item }) => ({
    ...item,
    amount,
    details: <YieldDetails amount={amount} apy={apy} />,
  })),
});

export const YieldAllocation: Story = {
  args: {
    ...toYieldStoryArgs(strategies),
    footnote:
      "Projection based on current balances and APYs. Actual yield will vary as rates and allocations change.",
    header: <YieldHeader />,
    icon: <PieChartIcon />,
    isError: false,
    isLoading: false,
    label: "Yield allocation",
    value: "8 protocols",
  },
};

export const YieldAllocationWithTotalApy: Story = {
  args: {
    ...YieldAllocation.args,
    ...toYieldStoryArgs(strategies.slice(0, 3)),
  },
};
