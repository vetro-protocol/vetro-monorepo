import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { parseUnits } from "viem";

import { RenderFiatValue } from "../src/components/base/fiatValue";
import type { Token } from "../src/types";

const usdc: Token = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  chainId: 1,
  decimals: 6,
  logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdc.svg",
  name: "USD Coin",
  symbol: "USDC",
};

const createQueryClient = function (prices?: Record<string, string>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  if (prices) {
    client.setQueryData(["token-price"], prices);
  }
  return client;
};

const meta = {
  component: RenderFiatValue,
  title: "Components/FiatValue",
} satisfies Meta<typeof RenderFiatValue>;

export default meta;

type StoryType = StoryObj<typeof meta>;

export const WithValue: StoryType = {
  args: {
    queryStatus: "success",
    token: usdc,
    value: parseUnits("125.50", usdc.decimals),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient({ USDC: "1.00" })}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const Loading: StoryType = {
  args: {
    queryStatus: "pending",
    token: usdc,
    value: undefined,
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const Error: StoryType = {
  args: {
    queryStatus: "error",
    token: usdc,
    value: undefined,
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
