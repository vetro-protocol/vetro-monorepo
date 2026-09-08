import type { Meta, StoryObj } from "@storybook/react";
import { knownTokens } from "@vetro-protocol/core";
import Skeleton from "react-loading-skeleton";

import {
  TokenInteraction,
  TokenInteractionList,
} from "../src/components/base/tokenInteraction";
import { TokenChainLogo } from "../src/components/bridgeForm/tokenChainLogo";

const findToken = (symbol: string) =>
  knownTokens.find((token) => token.symbol === symbol)!;

const peggedToken = findToken("VUSD");
const shareToken = findToken("sVUSD");

const meta = {
  args: {
    amount: "100",
    detail: "$100",
    label: "You are depositing",
    token: peggedToken,
  },
  component: TokenInteraction,
  title: "Components/TokenInteraction",
} satisfies Meta<typeof TokenInteraction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
  },
};

export const WithSubtitle: Story = {
  args: {
    label: "You are requesting to withdraw",
    subtitle: "Ready to withdraw in 7 days",
  },
};

export const LoadingAmount: Story = {
  args: {
    amount: <Skeleton width={120} />,
    detail: <Skeleton width={40} />,
    label: "You will receive (estimated)",
  },
};

export const LongAmount: Story = {
  args: {
    amount: "1,234,567.891234",
    detail: "$1,234,567.89",
  },
};

export const WithCustomLogo: Story = {
  args: {
    label: "You are sending",
    logo: <TokenChainLogo size="large" token={peggedToken} />,
  },
};

export const List: Story = {
  args: {
    label: "You will stake",
  },
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => (
    <TokenInteractionList>
      <TokenInteraction {...args} />
      <TokenInteraction
        amount="97.58"
        detail="$97.58"
        label="You will receive (estimated)"
        token={shareToken}
      />
    </TokenInteractionList>
  ),
};
