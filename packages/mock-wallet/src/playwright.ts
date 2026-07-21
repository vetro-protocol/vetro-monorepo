import type { Page } from "@playwright/test";

import { MOCK_WALLET_INFO, type Eip6963ProviderInfo } from "./eip6963.ts";
import {
  type CreateMockWalletProviderParams,
  type RpcRequest,
  createMockWalletProvider,
} from "./provider.ts";

const REQUEST_BINDING = "__mockWalletRequest";

type InstallMockWalletParams = CreateMockWalletProviderParams & { page: Page };

// Inject an EIP-6963-announcing EIP-1193 provider into the page before the dApp
// scripts run, so RainbowKit connects to it silently — no extension popup, no
// confirm clicks. The wallet client runs in Node (behind page.exposeFunction);
// the page-side provider just forwards requests to it over that binding.
export async function installMockWallet({
  page,
  ...walletParams
}: InstallMockWalletParams) {
  const wallet = createMockWalletProvider(walletParams);

  await page.exposeFunction(REQUEST_BINDING, (request: RpcRequest) =>
    wallet.request(request),
  );

  await page.addInitScript(
    function ({
      bindingName,
      info,
    }: {
      bindingName: string;
      info: Eip6963ProviderInfo;
    }) {
      const request = (window as unknown as Record<string, unknown>)[
        bindingName
      ] as (req: RpcRequest) => Promise<unknown>;
      const provider = {
        on() {},
        removeListener() {},
        request,
      };
      // This announce mirrors announceEip6963Provider, re-inlined because
      // addInitScript serialises the callback into the page — it can't import.
      const detail = Object.freeze({
        info: { ...info, uuid: crypto.randomUUID() },
        provider,
      });
      function announce() {
        window.dispatchEvent(
          new CustomEvent("eip6963:announceProvider", { detail }),
        );
      }
      announce();
      window.addEventListener("eip6963:requestProvider", announce);
      window.addEventListener("DOMContentLoaded", announce);
    },
    { bindingName: REQUEST_BINDING, info: MOCK_WALLET_INFO },
  );
}
