import type { Meta, StoryObj } from "@storybook/react";

import { FeeDetails } from "../src/components/feeDetails";
import { FeesContainer } from "../src/components/feesContainer";

const meta: Meta<typeof FeesContainer> = {
  argTypes: {
    children: {
      control: false,
    },
    isError: {
      control: "boolean",
    },
    label: {
      control: "text",
    },
    totalFees: {
      control: "text",
    },
  },
  component: FeesContainer,
  title: "Components/FeesContainer",
};

export default meta;
type Story = StoryObj<typeof FeesContainer>;

export const Default: Story = {
  args: {
    children: (
      <>
        <FeeDetails label="Network Fee" value="$0.0001" />
        <FeeDetails label="Percentage Fee" value="0.003%" />
        <FeeDetails label="ETH fee" value="0.0001 ETH" />
      </>
    ),
    label: "1000 USDC = 999 VUSD",
    totalFees: "$0.40",
  },
  render: (args) => (
    <div className="w-md">
      <FeesContainer {...args} />
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: (
      <>
        <FeeDetails label="Network Fee" />
        <FeeDetails label="Percentage Fee" />
      </>
    ),
    label: "1000 USDC = 999 VUSD",
  },
  render: (args) => (
    <div className="w-md">
      <FeesContainer {...args} />
    </div>
  ),
};

export const Error: Story = {
  args: {
    children: (
      <>
        <FeeDetails isError label="Network Fee" />
        <FeeDetails isError label="Percentage Fee" />
      </>
    ),
    isError: true,
    label: "1000 USDC = 999 VUSD",
  },
  render: (args) => (
    <div className="w-md">
      <FeesContainer {...args} />
    </div>
  ),
};
