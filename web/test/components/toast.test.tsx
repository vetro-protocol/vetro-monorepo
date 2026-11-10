import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { Toast } from "../../src/components/base/toast";

import { endTransition } from "./transitions";

const autoCloseMs = 300;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Without Tailwind there is no CSS transition, so the exit is finished manually
function finishExit(title: HTMLElement) {
  endTransition(title.closest("li")!.firstElementChild!);
}

describe("Toast", function () {
  it("restarts the auto-close timer when the toast is replaced", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <Toast autoCloseMs={autoCloseMs} onClose={onClose} title="First" />,
    );

    await wait(autoCloseMs * 0.7);
    await screen.rerender(
      <Toast autoCloseMs={autoCloseMs} onClose={onClose} title="Second" />,
    );
    const second = screen.getByText("Second");
    await wait(autoCloseMs * 0.7);
    finishExit(second.element() as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();

    await wait(autoCloseMs);
    finishExit(second.element() as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not let an exiting toast close the toast that replaced it", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <Toast autoCloseMs={autoCloseMs} onClose={onClose} title="First" />,
    );

    await wait(autoCloseMs * 2);
    await screen.rerender(
      <Toast
        autoCloseMs={autoCloseMs}
        description="Details"
        onClose={onClose}
        title="First"
        variant="error"
      />,
    );
    const replacement = screen.getByText("Details");
    finishExit(replacement.element() as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
    await expect.element(replacement).toBeInTheDocument();
  });

  it("auto-closes the replacement when focus was in the replaced toast", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <Toast autoCloseMs={autoCloseMs} onClose={onClose} title="First" />,
    );

    (
      screen
        .getByRole("button", { name: "Close notification" })
        .element() as HTMLElement
    ).focus();
    await screen.rerender(
      <Toast autoCloseMs={autoCloseMs} onClose={onClose} title="Second" />,
    );
    const second = screen.getByText("Second");
    await wait(autoCloseMs * 2);
    finishExit(second.element() as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
