import type { Meta, StoryObj } from "@storybook/react";

import { ActivityList } from "../src/components/base/activityList";
import { ActivityItem } from "../src/components/base/activityList/activityItem";

const MOCK_DATE = 1719619200; // Jun 29, 2024

const meta = {
  argTypes: {
    action: {
      control: "select",
      options: [
        "borrowMore",
        "deposit",
        "openLoan",
        "redeem",
        "repayPosition",
        "supplyPosition",
        "withdraw",
      ],
    },
    collateral: { control: "text" },
    date: { control: "number" },
    label: { control: "text" },
    page: { control: "select", options: ["borrow", "earn", "swap"] },
    status: { control: "select", options: ["concluded", "failed", "pending"] },
    symbol: { control: "text" },
  },
  component: ActivityItem,
  title: "Components/ActivityList",
} satisfies Meta<typeof ActivityItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ItemPending: Story = {
  args: {
    action: "deposit",
    date: MOCK_DATE,
    label: "0.004 USDC staked",
    page: "earn",
    status: "pending",
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
    action: "openLoan",
    date: MOCK_DATE,
    label: "100 VUSD borrowed",
    page: "borrow",
    status: "concluded",
    symbol: "VUSD",
  },
};

export const ItemBorrowSupplyPosition: Story = {
  args: {
    action: "supplyPosition",
    collateral: "BTC",
    date: MOCK_DATE,
    label: "1 BTC supplied",
    page: "borrow",
    status: "concluded",
    symbol: "VUSD",
  },
};

export const ItemBorrowMore: Story = {
  args: {
    action: "borrowMore",
    date: MOCK_DATE,
    label: "1,000 VUSD borrowed",
    page: "borrow",
    status: "concluded",
    symbol: "VUSD",
  },
};

export const ItemBorrowRepayPosition: Story = {
  args: {
    action: "repayPosition",
    date: MOCK_DATE,
    label: "1,000 VUSD repaid",
    page: "borrow",
    status: "concluded",
    symbol: "VUSD",
  },
};

export const ItemPageOnly: Story = {
  args: {
    date: MOCK_DATE,
    label: "500 USDC swapped",
    page: "swap",
    status: "concluded",
  },
};

export const ItemSwapRedeem: Story = {
  args: {
    action: "redeem",
    date: MOCK_DATE,
    label: "500 VUSD redeemed for USDC",
    page: "swap",
    status: "concluded",
  },
};

export const List: Story = {
  // @ts-expect-error render uses ActivityList directly, args are unused
  args: {},
  render: () => (
    <ActivityList
      items={[
        {
          action: "deposit",
          date: MOCK_DATE,
          label: "0.004 USDC staked",
          page: "earn",
          status: "pending",
        },
        {
          action: "withdraw",
          date: MOCK_DATE,
          label: "10.00 USDC withdrawn",
          page: "earn",
          status: "concluded",
        },
        {
          action: "redeem",
          date: MOCK_DATE,
          label: "500 VUSD redeemed for USDC",
          page: "swap",
          status: "failed",
        },
        {
          action: "openLoan",
          date: MOCK_DATE,
          label: "100 VUSD borrowed",
          page: "borrow",
          status: "concluded",
          symbol: "VUSD",
        },
      ]}
    />
  ),
};
