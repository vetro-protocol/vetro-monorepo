import {
  type DisclaimerComponent,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Trans } from "react-i18next";
import { http, WagmiProvider } from "wagmi";

import { ExternalLink } from "../components/base/externalLink";
import { allChains } from "../networks";

export const config = getDefaultConfig({
  appName: "Vetro",
  chains: allChains,
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  transports: Object.fromEntries(allChains.map((chain) => [chain.id, http()])),
});

const queryClient = new QueryClient();

const disclaimerLinkClassName =
  "font-medium text-blue-500 transition-colors hover:text-blue-600";

const WalletDisclaimer: DisclaimerComponent = ({ Text }) => (
  <Text>
    <Trans
      components={{
        privacy: (
          <ExternalLink
            className={disclaimerLinkClassName}
            href="https://vetro.org/privacy-policy"
          />
        ),
        terms: (
          <ExternalLink
            className={disclaimerLinkClassName}
            href="https://vetro.org/terms-of-use"
          />
        ),
      }}
      i18nKey="common.wallet-disclaimer"
    />
  </Text>
);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider appInfo={{ disclaimer: WalletDisclaimer }}>
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
