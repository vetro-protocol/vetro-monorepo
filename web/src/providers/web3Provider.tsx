import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, WagmiProvider } from "wagmi";

import { allChains } from "../networks";

export const config = getDefaultConfig({
  appName: "Vetro",
  chains: allChains,
  // TODO add project id for wallet connect
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  transports: Object.fromEntries(allChains.map((chain) => [chain.id, http()])),
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
