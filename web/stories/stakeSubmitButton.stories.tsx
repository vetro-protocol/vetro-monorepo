import type { Meta, StoryObj } from "@storybook/react";

import { StakeSubmitButton } from "../src/pages/earn/components/stakeDrawer/stakeSubmitButton";

const meta: Meta<typeof StakeSubmitButton> = {
  args: {
    connectWalletText: "Connect Wallet",
    enterAmountText: "Enter amount",
    insufficientBalanceText: "Insufficient balance",
    insufficientGasText: "Insufficient gas",
  },
  component: StakeSubmitButton,
  title: "Components/StakeSubmitButton",
};

export default meta;
type Story = StoryObj<typeof StakeSubmitButton>;

export const Default: Story = {
  args: {
    actionText: "Deposit",
    balancesLoaded: true,
    inputError: undefined,
    isConnected: true,
    isPending: false,
    pendingText: "Depositing...",
  },
};

export const ConnectWallet: Story = {
  args: {
    actionText: "Deposit",
    balancesLoaded: true,
    inputError: undefined,
    isConnected: false,
    isPending: false,
    pendingText: "Depositing...",
  },
};

export const EnterAmount: Story = {
  args: {
    actionText: "Deposit",
    balancesLoaded: true,
    inputError: "enter-amount",
    isConnected: true,
    isPending: false,
    pendingText: "Depositing...",
  },
};

export const InsufficientBalance: Story = {
  args: {
    actionText: "Deposit",
    balancesLoaded: true,
    inputError: "insufficient-balance",
    isConnected: true,
    isPending: false,
    pendingText: "Depositing...",
  },
};

export const InsufficientGas: Story = {
  args: {
    actionText: "Deposit",
    balancesLoaded: true,
    inputError: "insufficient-gas",
    isConnected: true,
    isPending: false,
    pendingText: "Depositing...",
  },
};

export const Pending: Story = {
  args: {
    actionText: "Deposit",
    balancesLoaded: true,
    inputError: undefined,
    isConnected: true,
    isPending: true,
    pendingText: "Depositing...",
  },
};

export const BalancesLoading: Story = {
  args: {
    actionText: "Deposit",
    balancesLoaded: false,
    inputError: undefined,
    isConnected: true,
    isPending: false,
    pendingText: "Depositing...",
  },
};

export const WithdrawAction: Story = {
  args: {
    actionText: "Withdraw",
    balancesLoaded: true,
    inputError: undefined,
    isConnected: true,
    isPending: false,
    pendingText: "Withdrawing...",
  },
};
