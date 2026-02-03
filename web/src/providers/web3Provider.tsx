import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, sepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";

const config = getDefaultConfig({
  appName: "Vetro",
  chains: [mainnet, sepolia],
  // TODO add project id for wallet connect
  projectId: "YOUR_PROJECT_ID_HERE",
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
