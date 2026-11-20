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
        details: <YieldDetails apy={6.13} projectedYield={9.0111} />,
        href: "https://app.morpho.org/ethereum/vault/0x23f5E9c35820f4baB695Ac1F19c203cC3f8e1e11",
        label: "Morpho",
      },
      {
        amount: 100,
        color: "bg-rose-400",
        details: <YieldDetails apy={3.62} projectedYield={3.62} />,
        href: "https://app.lagoon.finance/vault/1/0x08D97f1B434d9e164218ee1DD9611290dA238b79",
        label: "Summer.fi",
      },
      {
        amount: 80,
        color: "bg-blue-400",
        details: <YieldDetails apy={4.24} projectedYield={3.392} />,
        label: "Aave",
      },
      {
        amount: 64,
        color: "bg-amber-400",
        details: <YieldDetails apy={undefined} projectedYield={undefined} />,
        label: "Compound",
      },
    ],
    onHover: () => undefined,
  },
};

export const WithSubLabels: Story = {
  args: {
    hoveredLabel: null,
    isError: false,
    isLoading: false,
    items: [
      {
        amount: 0,
        color: "",
        formattedAmount: "$32.43K",
        label: "Backend yield earned",
        subLabel: "4.87% on $665.79K Treasury balance",
      },
      {
        amount: 12_180,
        color: "bg-blue-500",
        formattedAmount: "−$12.18K",
        label: "Paid to sVUSD stakers",
        subLabel: "10.51% on $115.85K staked · 37.56% of backend yield",
      },
      {
        amount: 20_250,
        amountClassName: "text-emerald-700",
        color: "bg-emerald-400",
        formattedAmount: "+$20.25K",
        label: "Net protocol revenue",
        labelClassName: "text-xsm font-semibold",
        subLabel: "Kept by the protocol · 62.44% of backend yield",
      },
    ],
    onHover: () => undefined,
  },
};
