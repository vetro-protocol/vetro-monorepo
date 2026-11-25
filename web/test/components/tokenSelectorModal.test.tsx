import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { knownTokens } from "@vetro-protocol/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { createConfig, http, WagmiProvider } from "wagmi";

import { TokenSelectorModal } from "../../src/components/tokenSelectorModal";
import { mainnet } from "../../src/networks/mainnet";

const viewportSize = vi.hoisted(() => ({ height: 768, width: 1024 }));

vi.mock("@hemilabs/react-hooks/useWindowSize", () => ({
  useWindowSize: () => viewportSize,
}));

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

async function renderModal() {
  const tokens = knownTokens.slice(0, 2);
  const value = tokens[0];
  if (!value || tokens.length < 2) {
    throw new Error("The token selector test requires at least two tokens.");
  }

  const queryClient = new QueryClient();
  const screen = await render(
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TokenSelectorModal
          onChange={vi.fn()}
          tokens={tokens}
          triggerLabel="Select token"
          value={value}
        />
      </QueryClientProvider>
    </WagmiProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Select token" });

  return { screen, trigger };
}

describe("TokenSelectorModal", function () {
  beforeEach(function () {
    viewportSize.width = 1024;
  });

  it("focuses the search input when opened on desktop", async function () {
    const { screen, trigger } = await renderModal();

    await trigger.click();

    await expect
      .element(screen.getByRole("textbox", { name: "Search" }))
      .toHaveFocus();
  });

  it("does not focus the search input when opened on mobile", async function () {
    viewportSize.width = 375;
    const { screen, trigger } = await renderModal();

    await trigger.click();

    await expect
      .element(screen.getByRole("textbox", { name: "Search" }))
      .not.toHaveFocus();
    await expect.element(trigger).toHaveFocus();
  });
});
