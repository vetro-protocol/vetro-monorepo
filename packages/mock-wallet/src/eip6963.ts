import type { RpcRequest } from "./provider.ts";

// Blank 24x24 SVG — wallet-discovery UIs require an icon, but the mock wallet
// doesn't need a recognisable one.
const ICON =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'/>";

export type Eip6963ProviderInfo = {
  icon: string;
  name: string;
  rdns: string;
};

// Frozen: shared across every host — a consumer mutating it would silently
// change the identity all other hosts announce.
export const MOCK_WALLET_INFO = Object.freeze({
  icon: ICON,
  name: "Mock Wallet",
  rdns: "com.example.mock-wallet",
} satisfies Eip6963ProviderInfo);

// The EIP-1193 object a discovery UI connects to. The no-op event methods are
// enough for RainbowKit/wagmi, which never subscribe to a mock wallet's events.
export type Eip6963Provider = {
  on: () => void;
  removeListener: () => void;
  request: (request: RpcRequest) => Promise<unknown>;
};

// Announce an EIP-1193 provider to the page via EIP-6963 so wallet-discovery
// (RainbowKit/wagmi) picks it up with no browser extension. Browser-only —
// touches window — so call it from page code, not Node. The Playwright installer
// inlines an equivalent announce inside addInitScript instead, because that
// callback is serialised into the page and can't import this module.
export function announceEip6963Provider({
  info,
  provider,
}: {
  info: Eip6963ProviderInfo;
  provider: Eip6963Provider;
}) {
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
}
