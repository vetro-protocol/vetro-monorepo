import type { Meta, StoryObj } from "@storybook/react";

import { ActivityList } from "../src/components/base/activityList";
import { ActivityItem } from "../src/components/base/activityList/activityItem";

const MOCK_DATE = 1719619200; // Jun 29, 2024

const meta = {
  argTypes: {
    date: { control: "number" },
    page: { control: "select", options: ["borrow", "earn", "swap"] },
    status: { control: "select", options: ["concluded", "failed", "pending"] },
    text: { control: "text" },
    title: { control: "text" },
  },
  component: ActivityItem,
  title: "Components/ActivityList",
} satisfies Meta<typeof ActivityItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ItemPending: Story = {
  args: {
    date: MOCK_DATE,
    page: "earn",
    status: "pending",
    text: "0.004 USDC staked",
    title: "Earn · Deposit",
  },
};

export const ItemConcluded: Story = {
  args: {
    ...ItemPending.args,
    status: "concluded",
  },
};

export const ItemFailed: Story = {
  args: {
    ...ItemPending.args,
    status: "failed",
  },
};

export const ItemBorrow: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "concluded",
    text: "100 VUSD borrowed",
    title: "Borrow · Open VUSD loan",
  },
};

export const ItemBorrowSupplyPosition: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "concluded",
    text: "1 BTC supplied",
    title: "Borrow · Supply BTC to VUSD position",
  },
};

export const ItemBorrowMore: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "concluded",
    text: "1,000 VUSD borrowed",
    title: "Borrow · Borrow more VUSD",
  },
};

export const ItemBorrowRepayPosition: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "concluded",
    text: "1,000 VUSD repaid",
    title: "Borrow · Repay VUSD position",
  },
};

export const ItemPageOnly: Story = {
  args: {
    date: MOCK_DATE,
    page: "swap",
    status: "concluded",
    text: "500 USDC swapped",
    title: "Swap",
  },
};

export const ItemSwapRedeem: Story = {
  args: {
    date: MOCK_DATE,
    page: "swap",
    status: "concluded",
    text: "500 VUSD redeemed for USDC",
    title: "Swap · Redeem",
  },
};

export const List: Story = {
  // @ts-expect-error render uses ActivityList directly, args are unused
  args: {},
  render: () => (
    <ActivityList
      items={[
        {
          date: MOCK_DATE,
          page: "earn",
          status: "pending",
          text: "0.004 USDC staked",
          title: "Earn · Deposit",
        },
        {
          date: MOCK_DATE + 1,
          page: "earn",
          status: "concluded",
          text: "10.00 USDC withdrawn",
          title: "Earn · Withdraw",
        },
        {
          date: MOCK_DATE + 2,
          page: "swap",
          status: "failed",
          text: "500 VUSD redeemed for USDC",
          title: "Swap · Redeem",
        },
        {
          date: MOCK_DATE + 3,
          page: "borrow",
          status: "concluded",
          text: "100 VUSD borrowed",
          title: "Borrow · Open VUSD loan",
        },
      ]}
    />
  ),
};
