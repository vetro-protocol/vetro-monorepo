import type { Decorator } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";

import { mainnet } from "../src/networks/mainnet";

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

// .storybook/preview.tsx only spies on wagmi, so components that call real
// wagmi or react-query hooks still need these providers.
export const withWagmi =
  (
    queryClient: QueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
  ): Decorator =>
  (Story) => (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    </WagmiProvider>
  );
