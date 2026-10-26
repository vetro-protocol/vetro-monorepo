import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Modal } from "../../src/components/base/modal";

import { endTransition, waitForClosed, waitForOpen } from "./transitions";

async function renderNestedModals() {
  const onCloseInner = vi.fn();
  const onCloseOuter = vi.fn();
  const screen = await render(
    <Modal ariaLabel="Outer" onClose={onCloseOuter}>
      {() => null}
    </Modal>,
  );
  await waitForOpen(screen.getByRole("dialog", { name: "Outer" }));
  await screen.rerender(
    <Modal ariaLabel="Outer" onClose={onCloseOuter}>
      {() => (
        <Modal ariaLabel="Inner" onClose={onCloseInner}>
          {() => <p>Inner content</p>}
        </Modal>
      )}
    </Modal>,
  );
  await waitForOpen(screen.getByRole("dialog", { name: "Inner" }));
  return { onCloseInner, onCloseOuter, screen };
}

describe("Modal", function () {
  it("renders a modal dialog in document.body, named by ariaLabel", async function () {
    const screen = await render(
      <div data-testid="parent">
        <Modal ariaLabel="Settings" onClose={vi.fn()}>
          {() => <p>Content</p>}
        </Modal>
      </div>,
    );
    const dialog = screen.getByRole("dialog", { name: "Settings" });

    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    await expect.element(dialog).toHaveTextContent("Content");
    expect(document.body).toContainElement(dialog.element());
    await expect
      .element(screen.getByTestId("parent"))
      .not.toContainElement(dialog.element());
  });

  it("names the dialog by ariaLabelledBy", async function () {
    const screen = await render(
      <Modal ariaLabelledBy="modal-title" onClose={vi.fn()}>
        {() => <h2 id="modal-title">Select token</h2>}
      </Modal>,
    );

    await expect
      .element(screen.getByRole("dialog", { name: "Select token" }))
      .toBeInTheDocument();
  });

  it("calls onClose after the exit transition when the content calls close", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <Modal ariaLabel="Settings" onClose={onClose}>
        {({ close }) => (
          <button onClick={close} type="button">
            Done
          </button>
        )}
      </Modal>,
    );
    await waitForOpen(screen.getByRole("dialog"));

    await screen.getByRole("button", { name: "Done" }).click();

    expect(onClose).not.toHaveBeenCalled();
    endTransition(screen.getByRole("dialog").element());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ignores a transitionend that bubbles from a descendant", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <Modal ariaLabel="Settings" onClose={onClose}>
        {({ close }) => (
          <button onClick={close} type="button">
            Done
          </button>
        )}
      </Modal>,
    );
    await waitForOpen(screen.getByRole("dialog"));
    const button = screen.getByRole("button", { name: "Done" });

    await button.click();
    endTransition(button.element());
    expect(onClose).not.toHaveBeenCalled();

    endTransition(screen.getByRole("dialog").element());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <Modal ariaLabel="Settings" onClose={onClose}>
        {() => <p>Content</p>}
      </Modal>,
    );
    await waitForOpen(screen.getByRole("dialog"));

    await userEvent.keyboard("{Escape}");
    endTransition(screen.getByRole("dialog").element());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on a click outside the dialog, but not on a click inside", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <>
        <button type="button">Outside</button>
        <Modal ariaLabel="Settings" onClose={onClose}>
          {() => <button type="button">Inside</button>}
        </Modal>
      </>,
    );
    await waitForOpen(screen.getByRole("dialog"));
    const dialog = screen.getByRole("dialog").element();

    await screen.getByRole("button", { name: "Inside" }).click();
    endTransition(dialog);
    expect(onClose).not.toHaveBeenCalled();

    await screen.getByRole("button", { name: "Outside" }).click();
    endTransition(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on a tap outside the dialog", async function () {
    const onClose = vi.fn();
    const screen = await render(
      <>
        <button type="button">Outside</button>
        <Modal ariaLabel="Settings" onClose={onClose}>
          {() => <p>Content</p>}
        </Modal>
      </>,
    );
    await waitForOpen(screen.getByRole("dialog"));

    screen
      .getByRole("button", { name: "Outside" })
      .element()
      .dispatchEvent(new TouchEvent("touchstart", { bubbles: true }));

    await waitForClosed(screen.getByRole("dialog"));
    endTransition(screen.getByRole("dialog").element());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not dismiss the outer modal on a click inside the inner modal", async function () {
    const { onCloseInner, onCloseOuter, screen } = await renderNestedModals();

    await screen.getByText("Inner content").click();
    endTransition(screen.getByRole("dialog", { name: "Inner" }).element());
    endTransition(screen.getByRole("dialog", { name: "Outer" }).element());

    expect(onCloseInner).not.toHaveBeenCalled();
    expect(onCloseOuter).not.toHaveBeenCalled();
  });

  it("closes only the topmost of nested modals on Escape", async function () {
    const { onCloseInner, onCloseOuter, screen } = await renderNestedModals();

    await userEvent.keyboard("{Escape}");
    endTransition(screen.getByRole("dialog", { name: "Inner" }).element());
    endTransition(screen.getByRole("dialog", { name: "Outer" }).element());

    expect(onCloseInner).toHaveBeenCalledOnce();
    expect(onCloseOuter).not.toHaveBeenCalled();
  });
});
