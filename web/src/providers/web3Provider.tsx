import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, WagmiProvider } from "wagmi";

import { mainnet } from "../networks";

export const config = getDefaultConfig({
  appName: "Vetro",
  chains: [mainnet],
  // TODO add project id for wallet connect
  projectId: "YOUR_PROJECT_ID_HERE",
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
