import type { Meta, StoryObj } from "@storybook/react";

import { StatCard } from "../src/pages/earn/components/statCard";
import { BoltIcon } from "../src/pages/earn/icons/boltIcon";
import { SparklesIcon } from "../src/pages/earn/icons/sparklesIcon";
import { TrendingUpIcon } from "../src/pages/earn/icons/trendingUpIcon";

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
    value: "10,000.00 VUSD",
  },
};

export const EarnedAmount: Story = {
  args: {
    icon: <TrendingUpIcon />,
    label: "Your earned amount",
    value: "1,234.56 sVUSD",
  },
};

export const Rewards: Story = {
  args: {
    icon: <SparklesIcon />,
    label: "Your rewards",
    value: "567.89 Hemi",
  },
};

export const Loading: Story = {
  args: {
    icon: <BoltIcon />,
    isLoading: true,
    label: "Your staked balance",
    value: "",
  },
};

export const Empty: Story = {
  args: {
    icon: <BoltIcon />,
    label: "Your staked balance",
    value: "",
  },
};
