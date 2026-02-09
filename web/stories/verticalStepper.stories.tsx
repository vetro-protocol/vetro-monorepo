import type { Meta, StoryObj } from "@storybook/react";

import { VerticalStepper } from "../src/components/base/verticalStepper";

const meta: Meta<typeof VerticalStepper> = {
  component: VerticalStepper,
  title: "Components/VerticalStepper",
};

export default meta;
type Story = StoryObj<typeof VerticalStepper>;

export const WithdrawalSteps: Story = {
  args: {
    steps: [
      {
        description:
          "Submit a withdrawal request to begin the exit process. Your funds remain staked at this stage.",
        title: "Request withdrawal",
      },
      {
        description:
          "A 7-day cooldown period begins. During this time, your funds are locked and no yield is earned.",
        title: "Start 7-day cooldown",
      },
      {
        description:
          "Once the cooldown ends, your funds become available to unlock and withdraw.",
        title: "Withdraw funds",
      },
    ],
  },
};

export const TwoSteps: Story = {
  args: {
    steps: [
      {
        description: "First step description goes here.",
        title: "Step one",
      },
      {
        description: "Second step description goes here.",
        title: "Step two",
      },
    ],
  },
};

export const FourSteps: Story = {
  args: {
    steps: [
      {
        description: "Connect your wallet to get started.",
        title: "Connect wallet",
      },
      {
        description: "Enter the amount you want to deposit.",
        title: "Enter amount",
      },
      {
        description: "Approve the transaction in your wallet.",
        title: "Approve transaction",
      },
      {
        description: "Your deposit is complete!",
        title: "Done",
      },
    ],
  },
};
