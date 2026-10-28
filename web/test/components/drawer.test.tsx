import { type ReactNode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Drawer } from "../../src/components/base/drawer";
import { Modal } from "../../src/components/base/modal";

import { endTransition, waitForClosed, waitForOpen } from "./transitions";

type DrawerTreeProps = {
  onClose: VoidFunction;
  requestClose?: boolean;
};

const DrawerTree = ({ onClose, requestClose }: DrawerTreeProps) => (
  <>
    <button type="button">Outside</button>
    <Drawer onClose={onClose} requestClose={requestClose} title="Settings">
      <button type="button">Inside</button>
    </Drawer>
  </>
);

function DrawerWithModal({ onClose }: { onClose: VoidFunction }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <Drawer onClose={onClose} title="Settings">
      <button onClick={() => setIsModalOpen(true)} type="button">
        Open modal
      </button>
      {isModalOpen && (
        <Modal ariaLabel="Confirm" onClose={() => setIsModalOpen(false)}>
          {() => <p>Modal content</p>}
        </Modal>
      )}
    </Drawer>
  );
}

async function renderDrawer(ui: ReactNode) {
  const screen = await render(ui);
  const drawer = screen.getByRole("dialog", { name: "Settings" });
  await waitForOpen(drawer);
  return { drawer, screen };
}

async function renderDrawerWithModal() {
  const onClose = vi.fn();
  const { drawer, screen } = await renderDrawer(
    <DrawerWithModal onClose={onClose} />,
  );
  await screen.getByRole("button", { name: "Open modal" }).click();
  const modal = screen.getByRole("dialog", { name: "Confirm" });
  await waitForOpen(modal);
  return { drawer, modal, onClose, screen };
}

describe("Drawer", function () {
  it("renders a modal dialog outside its parent, named by its title", async function () {
    const screen = await render(
      <div data-testid="parent">
        <Drawer onClose={vi.fn()} title="Settings">
          <p>Content</p>
        </Drawer>
      </div>,
    );
    const drawer = screen.getByRole("dialog", { name: "Settings" });

    await expect.element(drawer).toHaveAttribute("aria-modal", "true");
    await expect
      .element(drawer.getByRole("heading", { name: "Settings" }))
      .toBeVisible();
    await expect.element(drawer.getByText("Content")).toBeInTheDocument();
    await expect
      .element(screen.getByTestId("parent"))
      .not.toContainElement(drawer.element());
  });

  it("names the dialog by ariaLabel", async function () {
    const screen = await render(
      <Drawer ariaLabel="Wallet" onClose={vi.fn()}>
        <p>Content</p>
      </Drawer>,
    );

    await expect
      .element(screen.getByRole("dialog", { name: "Wallet" }))
      .toBeInTheDocument();
  });

  it("calls onClose after the exit transition when the parent requests close", async function () {
    const onClose = vi.fn();
    const { drawer, screen } = await renderDrawer(
      <DrawerTree onClose={onClose} />,
    );

    await screen.rerender(<DrawerTree onClose={onClose} requestClose />);
    await waitForClosed(drawer);

    expect(onClose).not.toHaveBeenCalled();
    endTransition(drawer.element());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape", async function () {
    const onClose = vi.fn();
    const { drawer, screen } = await renderDrawer(
      <DrawerTree onClose={onClose} />,
    );

    await userEvent.keyboard("{Escape}");
    await waitForClosed(drawer);
    endTransition(screen.getByRole("button", { name: "Inside" }).element());
    expect(onClose).not.toHaveBeenCalled();

    endTransition(drawer.element());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on a click outside the drawer, but not on a click inside", async function () {
    const onClose = vi.fn();
    const { drawer, screen } = await renderDrawer(
      <DrawerTree onClose={onClose} />,
    );

    await screen.getByRole("button", { name: "Inside" }).click();
    endTransition(drawer.element());
    expect(onClose).not.toHaveBeenCalled();

    await screen.getByRole("button", { name: "Outside" }).click();
    await waitForClosed(drawer);
    endTransition(drawer.element());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("stays open on a click inside a modal opened from it", async function () {
    const { drawer, modal, onClose, screen } = await renderDrawerWithModal();

    await screen.getByText("Modal content").click();
    endTransition(modal.element());
    endTransition(drawer.element());

    await expect.element(modal).toBeInTheDocument();
    await expect.element(drawer).toHaveAttribute("data-state", "open");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape again after a modal opened from it closes", async function () {
    const { drawer, modal, onClose } = await renderDrawerWithModal();

    await userEvent.keyboard("{Escape}");
    await waitForClosed(modal);
    endTransition(modal.element());
    await expect.element(modal).not.toBeInTheDocument();
    await expect.element(drawer).toHaveAttribute("data-state", "open");
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    await waitForClosed(drawer);
    endTransition(drawer.element());
    expect(onClose).toHaveBeenCalledOnce();
  });
});
