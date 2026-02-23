import type { Meta, StoryObj } from "@storybook/react";
import Skeleton from "react-loading-skeleton";

import {
  stepStatus,
  VerticalStepper,
} from "../src/components/base/verticalStepper";

const meta: Meta<typeof VerticalStepper> = {
  component: VerticalStepper,
  title: "Components/VerticalStepper",
};

export default meta;
type Story = StoryObj<typeof VerticalStepper>;

const swapSteps = {
  allCompleted: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.completed,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.completed,
      title: "Confirm swap",
    },
  ],
  firstActive: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.ready,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.notReady,
      title: "Confirm swap",
    },
  ],
  firstFailed: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.failed,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.notReady,
      title: "Confirm swap",
    },
  ],
  firstSpinning: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.progress,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.notReady,
      title: "Confirm swap",
    },
  ],
  idle: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.notReady,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.notReady,
      title: "Confirm swap",
    },
  ],
  secondActive: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.completed,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.ready,
      title: "Confirm swap",
    },
  ],
  secondFailed: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.completed,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.failed,
      title: "Confirm swap",
    },
  ],
  secondSpinning: [
    {
      description: "This allows the app to use this token for your swap.",
      status: stepStatus.completed,
      title: "Approve in wallet",
    },
    {
      description: "Review the details and confirm the swap in your wallet.",
      status: stepStatus.progress,
      title: "Confirm swap",
    },
  ],
};

const withdrawalSteps = {
  allReady: [
    {
      description:
        "Submit a withdrawal request to begin the exit process. Your funds remain staked at this stage.",
      status: stepStatus.ready,
      title: "Request withdrawal",
    },
    {
      description:
        "A 7-day cooldown period begins. During this time, your funds are locked and no yield is earned.",
      status: stepStatus.ready,
      title: "Start 7-day cooldown",
    },
    {
      description:
        "Once the cooldown ends, your funds become available to unlock and withdraw.",
      status: stepStatus.ready,
      title: "Withdraw funds",
    },
  ],
  firstActive: [
    {
      description:
        "Submit a withdrawal request to begin the exit process. Your funds remain staked at this stage.",
      status: stepStatus.ready,
      title: "Request withdrawal",
    },
    {
      description:
        "A 7-day cooldown period begins. During this time, your funds are locked and no yield is earned.",
      status: stepStatus.notReady,
      title: "Start 7-day cooldown",
    },
    {
      description:
        "Once the cooldown ends, your funds become available to unlock and withdraw.",
      status: stepStatus.notReady,
      title: "Withdraw funds",
    },
  ],
  firstSpinning: [
    {
      description:
        "Submit a withdrawal request to begin the exit process. Your funds remain staked at this stage.",
      status: stepStatus.progress,
      title: "Request withdrawal",
    },
    {
      description:
        "A 7-day cooldown period begins. During this time, your funds are locked and no yield is earned.",
      status: stepStatus.notReady,
      title: "Start 7-day cooldown",
    },
    {
      description:
        "Once the cooldown ends, your funds become available to unlock and withdraw.",
      status: stepStatus.notReady,
      title: "Withdraw funds",
    },
  ],
  secondActive: [
    {
      description:
        "Submit a withdrawal request to begin the exit process. Your funds remain staked at this stage.",
      status: stepStatus.completed,
      title: "Request withdrawal",
    },
    {
      description:
        "A 7-day cooldown period begins. During this time, your funds are locked and no yield is earned.",
      status: stepStatus.ready,
      title: "Start 7-day cooldown",
    },
    {
      description:
        "Once the cooldown ends, your funds become available to unlock and withdraw.",
      status: stepStatus.notReady,
      title: "Withdraw funds",
    },
  ],

  thirdActive: [
    {
      description:
        "Submit a withdrawal request to begin the exit process. Your funds remain staked at this stage.",
      status: stepStatus.completed,
      title: "Request withdrawal",
    },
    {
      description:
        "A 7-day cooldown period begins. During this time, your funds are locked and no yield is earned.",
      status: stepStatus.completed,
      title: "Start 7-day cooldown",
    },
    {
      description:
        "Once the cooldown ends, your funds become available to unlock and withdraw.",
      status: stepStatus.ready,
      title: "Withdraw funds",
    },
  ],
};

export const FirstStepActive: Story = {
  args: {
    steps: swapSteps.firstActive,
  },
};

export const FirstStepSpinning: Story = {
  args: {
    steps: swapSteps.firstSpinning,
  },
};

export const SecondStepActive: Story = {
  args: {
    steps: swapSteps.secondActive,
  },
};

export const SecondStepSpinning: Story = {
  args: {
    steps: swapSteps.secondSpinning,
  },
};

export const AllStepsCompleted: Story = {
  args: {
    steps: swapSteps.allCompleted,
  },
};

export const Idle: Story = {
  args: {
    steps: swapSteps.idle,
  },
};

export const ThreeStepsFirstActive: Story = {
  args: {
    steps: withdrawalSteps.firstActive,
  },
};

export const ThreeStepsFirstSpinning: Story = {
  args: {
    steps: withdrawalSteps.firstSpinning,
  },
};

export const ThreeStepsSecondActive: Story = {
  args: {
    steps: withdrawalSteps.secondActive,
  },
};

export const ThreeStepsAllReady: Story = {
  args: {
    steps: withdrawalSteps.allReady,
  },
};

export const ThreeStepsThirdActive: Story = {
  args: {
    steps: withdrawalSteps.thirdActive,
  },
};

export const FirstStepFailed: Story = {
  args: {
    steps: swapSteps.firstFailed,
  },
};

export const SecondStepFailed: Story = {
  args: {
    steps: swapSteps.secondFailed,
  },
};

export const WithLoadingSkeleton: Story = {
  args: {
    steps: [
      {
        description:
          "Submit a withdrawal request to begin the exit process. Your funds remain staked at this stage.",
        status: stepStatus.ready,
        title: "Request withdrawal",
      },
      {
        description: <Skeleton width={200} />,
        status: stepStatus.notReady,
        title: <Skeleton width={140} />,
      },
      {
        description:
          "Once the cooldown ends, your funds become available to unlock and withdraw.",
        status: stepStatus.notReady,
        title: "Withdraw funds",
      },
    ],
  },
};
