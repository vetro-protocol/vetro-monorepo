import type { Address } from "viem";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { RequireWalletConnected } from "../../src/components/requireWalletConnected";

const mocks = vi.hoisted(() => ({
  address: undefined as Address | undefined,
  openConnectModal: vi.fn(),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => ({ openConnectModal: mocks.openConnectModal }),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mocks.address }),
}));

describe("RequireWalletConnected", function () {
  it("renders the children when a wallet is connected", async function () {
    mocks.address = "0x0000000000000000000000000000000000000001";
    const screen = await render(
      <RequireWalletConnected>
        <button type="button">Claim</button>
      </RequireWalletConnected>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Claim" }))
      .toBeVisible();
    expect(
      screen.getByRole("button", { name: "Connect wallet" }).query(),
    ).toBeNull();
  });

  it("shows a connect wallet button that opens the connect modal when no wallet is connected", async function () {
    mocks.address = undefined;
    const screen = await render(
      <RequireWalletConnected>
        <button type="button">Claim</button>
      </RequireWalletConnected>,
    );
    const connectButton = screen.getByRole("button", {
      name: "Connect wallet",
    });

    await expect.element(connectButton).toBeVisible();
    expect(screen.getByRole("button", { name: "Claim" }).query()).toBeNull();

    await connectButton.click();

    expect(mocks.openConnectModal).toHaveBeenCalledOnce();
  });
});
