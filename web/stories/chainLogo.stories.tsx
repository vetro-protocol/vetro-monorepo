import type { Meta, StoryObj } from "@storybook/react";
import type { Chain } from "viem";
import { arbitrum, base, bsc, hemi, mainnet, optimism } from "viem/chains";

import { ChainLogo } from "../src/components/chainLogo";

const unknownChain = {
  id: 999999,
  name: "Xyz Chain",
  nativeCurrency: { decimals: 18, name: "Xyz", symbol: "XYZ" },
  rpcUrls: { default: { http: [] } },
} as unknown as Chain;

const meta: Meta<typeof ChainLogo> = {
  args: {
    size: "small",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["base", "small"],
    },
  },
  component: ChainLogo,
  title: "Components/ChainLogo",
};

export default meta;
type Story = StoryObj<typeof ChainLogo>;

export const Ethereum: Story = {
  args: { chain: mainnet },
};

export const Hemi: Story = {
  args: { chain: hemi },
};

export const Arbitrum: Story = {
  args: { chain: arbitrum },
};

export const Base: Story = {
  args: { chain: base },
};

export const Optimism: Story = {
  args: { chain: optimism },
};

export const Bsc: Story = {
  args: { chain: bsc },
};

export const UnknownChain: Story = {
  args: { chain: unknownChain },
};
