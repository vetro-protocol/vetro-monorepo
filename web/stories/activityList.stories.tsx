import type { Meta, StoryObj } from "@storybook/react";

import { ActivityList } from "../src/components/base/activityList";
import { ActivityItem } from "../src/components/base/activityList/activityItem";

const MOCK_DATE = 1719619200; // Jun 29, 2024

const meta = {
  argTypes: {
    date: { control: "number" },
    page: { control: "select", options: ["borrow", "earn", "swap"] },
    status: { control: "select", options: ["completed", "failed", "pending"] },
    text: { control: "text" },
    title: { control: "text" },
    txHash: { control: "text" },
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
    txHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
  },
};

export const ItemConcluded: Story = {
  args: {
    ...ItemPending.args,
    status: "completed",
    txHash:
      "0x2222222222222222222222222222222222222222222222222222222222222222",
  },
};

export const ItemFailed: Story = {
  args: {
    ...ItemPending.args,
    status: "failed",
    txHash:
      "0x3333333333333333333333333333333333333333333333333333333333333333",
  },
};

export const ItemBorrow: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "completed",
    text: "100 VUSD borrowed",
    title: "Borrow · Open VUSD loan",
    txHash:
      "0x4444444444444444444444444444444444444444444444444444444444444444",
  },
};

export const ItemBorrowSupplyPosition: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "completed",
    text: "1 BTC supplied",
    title: "Borrow · Supply BTC to VUSD position",
    txHash:
      "0x5555555555555555555555555555555555555555555555555555555555555555",
  },
};

export const ItemBorrowMore: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "completed",
    text: "1,000 VUSD borrowed",
    title: "Borrow · Borrow more VUSD",
    txHash:
      "0x6666666666666666666666666666666666666666666666666666666666666666",
  },
};

export const ItemBorrowRepayPosition: Story = {
  args: {
    date: MOCK_DATE,
    page: "borrow",
    status: "completed",
    text: "1,000 VUSD repaid",
    title: "Borrow · Repay VUSD position",
    txHash:
      "0x7777777777777777777777777777777777777777777777777777777777777777",
  },
};

export const ItemPageOnly: Story = {
  args: {
    date: MOCK_DATE,
    page: "swap",
    status: "completed",
    text: "500 USDC swapped",
    title: "Swap",
    txHash:
      "0x8888888888888888888888888888888888888888888888888888888888888888",
  },
};

export const ItemSwapRedeem: Story = {
  args: {
    date: MOCK_DATE,
    page: "swap",
    status: "completed",
    text: "500 VUSD redeemed for USDC",
    title: "Swap · Redeem",
    txHash:
      "0x9999999999999999999999999999999999999999999999999999999999999999",
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
          txHash:
            "0x1111111111111111111111111111111111111111111111111111111111111111",
        },
        {
          date: MOCK_DATE + 1,
          page: "earn",
          status: "completed",
          text: "10.00 USDC withdrawn",
          title: "Earn · Withdraw",
          txHash:
            "0x2222222222222222222222222222222222222222222222222222222222222222",
        },
        {
          date: MOCK_DATE + 2,
          page: "swap",
          status: "failed",
          text: "500 VUSD redeemed for USDC",
          title: "Swap · Redeem",
          txHash:
            "0x3333333333333333333333333333333333333333333333333333333333333333",
        },
        {
          date: MOCK_DATE + 3,
          page: "borrow",
          status: "completed",
          text: "100 VUSD borrowed",
          title: "Borrow · Open VUSD loan",
          txHash:
            "0x4444444444444444444444444444444444444444444444444444444444444444",
        },
      ]}
      onResetFilters={() => undefined}
    />
  ),
};
