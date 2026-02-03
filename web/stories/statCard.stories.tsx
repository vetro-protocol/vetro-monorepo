import type { Meta, StoryObj } from "@storybook/react";

import { BoltIcon } from "../src/pages/earn/icons/boltIcon";
import { SparklesIcon } from "../src/pages/earn/icons/sparklesIcon";
import { TrendingUpIcon } from "../src/pages/earn/icons/trendingUpIcon";
import { StatCard } from "../src/pages/earn/statCard";

const meta = {
  component: StatCard,
  title: "Earn/StatCard",
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StakedBalance: Story = {
  args: {
    icon: <BoltIcon />,
    label: "Your staked balance",
    value: "$10,000.00",
  },
};

export const EarnedAmount: Story = {
  args: {
    icon: <TrendingUpIcon />,
    label: "Your earned amount",
    value: "$1,234.56",
  },
};

export const Rewards: Story = {
  args: {
    icon: <SparklesIcon />,
    label: "Your rewards",
    value: "$567.89",
  },
};
