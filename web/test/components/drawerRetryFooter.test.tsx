import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { DrawerRetryFooter } from "../../src/components/base/drawer/drawerRetryFooter";

describe("DrawerRetryFooter", function () {
  it("renders nothing without onRetry", async function () {
    const screen = await render(<DrawerRetryFooter />);

    expect(screen.container).toBeEmptyDOMElement();
  });

  it("calls onRetry once when the user clicks Retry", async function () {
    const onRetry = vi.fn();
    const screen = await render(<DrawerRetryFooter onRetry={onRetry} />);

    await screen.getByRole("button", { name: "Retry" }).click();

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("removes the button when onRetry is removed", async function () {
    const screen = await render(<DrawerRetryFooter onRetry={vi.fn()} />);
    const retryButton = screen.getByRole("button", { name: "Retry" });

    await expect.element(retryButton).toBeInTheDocument();

    await screen.rerender(<DrawerRetryFooter />);

    expect(retryButton.query()).toBeInTheDocument();
    await expect.element(retryButton).not.toBeInTheDocument();
  });
});
