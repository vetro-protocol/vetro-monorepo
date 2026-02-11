import type { Meta, StoryObj } from "@storybook/react";

import { VerticalStepper } from "../src/components/base/verticalStepper";

const meta: Meta<typeof VerticalStepper> = {
  component: VerticalStepper,
  title: "Components/VerticalStepper",
};

export default meta;
type Story = StoryObj<typeof VerticalStepper>;

const swapSteps = [
  {
    description: "This allows the app to use this token for your swap.",
    title: "Approve in wallet",
  },
  {
    description: "Review the details and confirm the swap in your wallet.",
    title: "Confirm swap",
  },
];

const withdrawalSteps = [
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
];

export const FirstStepActive: Story = {
  args: {
    currentStep: 0,
    steps: swapSteps,
  },
};

export const FirstStepSpinning: Story = {
  args: {
    currentStep: 0,
    spinning: true,
    steps: swapSteps,
  },
};

export const SecondStepActive: Story = {
  args: {
    currentStep: 1,
    steps: swapSteps,
  },
};

export const SecondStepSpinning: Story = {
  args: {
    currentStep: 1,
    spinning: true,
    steps: swapSteps,
  },
};

export const AllStepsCompleted: Story = {
  args: {
    currentStep: 2,
    steps: swapSteps,
  },
};

export const DefaultNoCurrentStep: Story = {
  args: {
    steps: swapSteps,
  },
};

export const Idle: Story = {
  args: {
    currentStep: -1,
    steps: swapSteps,
  },
};

export const ThreeStepsFirstActive: Story = {
  args: {
    currentStep: 0,
    steps: withdrawalSteps,
  },
};

export const ThreeStepsFirstSpinning: Story = {
  args: {
    currentStep: 0,
    spinning: true,
    steps: withdrawalSteps,
  },
};

export const ThreeStepsSecondActive: Story = {
  args: {
    currentStep: 1,
    steps: withdrawalSteps,
  },
};

export const ThreeStepsAllActive: Story = {
  args: {
    currentStep: 2,
    steps: withdrawalSteps,
  },
};

export const ListMode: Story = {
  args: {
    mode: "list",
    steps: withdrawalSteps,
  },
};
