import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Drawer } from "../../src/components/base/drawer";
import { Tooltip } from "../../src/components/tooltip";

import { moveMouseAway } from "./mouse";
import { waitForOpen } from "./transitions";

function tapCenter(element: Element) {
  const { height, left, top, width } = element.getBoundingClientRect();
  const tapped = document.elementFromPoint(
    left + width / 2,
    top + height / 2,
  ) as HTMLElement;
  tapped.click();
}

describe("Tooltip", function () {
  beforeEach(async function () {
    await moveMouseAway();
  });

  it("opens on keyboard focus of a focusable child and closes on blur", async function () {
    const screen = await render(
      <>
        <Tooltip content="Tooltip text">
          <button>Claim</button>
        </Tooltip>
        <button>Next</button>
      </>,
    );

    await userEvent.tab();

    await expect
      .element(screen.getByRole("button", { name: "Claim" }))
      .toHaveFocus();
    await expect.element(screen.getByText("Tooltip text")).toBeVisible();

    await userEvent.tab();

    await expect
      .element(screen.getByRole("button", { name: "Next" }))
      .toHaveFocus();
    await expect.element(screen.getByText("Tooltip text")).not.toBeVisible();
  });

  it("opens on keyboard focus when the child cannot take focus", async function () {
    const screen = await render(
      <Tooltip content="Tooltip text">
        <span>Info</span>
      </Tooltip>,
    );

    await userEvent.tab();

    await expect.element(screen.getByText("Tooltip text")).toBeVisible();
  });

  it("opens on keyboard focus when the child is a disabled button", async function () {
    const screen = await render(
      <Tooltip content="Tooltip text">
        <button disabled>Claim</button>
      </Tooltip>,
    );

    await userEvent.tab();

    await expect.element(screen.getByText("Tooltip text")).toBeVisible();
  });

  it("opens on tap", async function () {
    const screen = await render(
      <Tooltip content="Tooltip text">
        <span>Info</span>
      </Tooltip>,
    );

    (screen.getByText("Info").element() as HTMLElement).click();

    await expect.element(screen.getByText("Tooltip text")).toBeVisible();
  });

  it("opens on tap of a disabled button", async function () {
    const screen = await render(
      <Tooltip content="Tooltip text">
        <button disabled>Claim</button>
      </Tooltip>,
    );

    tapCenter(screen.getByRole("button", { name: "Claim" }).element());

    await expect.element(screen.getByText("Tooltip text")).toBeVisible();
  });

  it("closes on a tap outside", async function () {
    const screen = await render(
      <Tooltip content="Tooltip text">
        <span>Info</span>
      </Tooltip>,
    );
    (screen.getByText("Info").element() as HTMLElement).click();
    await expect.element(screen.getByText("Tooltip text")).toBeVisible();

    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );

    await expect.element(screen.getByText("Tooltip text")).not.toBeVisible();
  });

  it("closes on Escape", async function () {
    const screen = await render(
      <Tooltip content="Tooltip text">
        <button>Claim</button>
      </Tooltip>,
    );
    await userEvent.tab();
    await expect.element(screen.getByText("Tooltip text")).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByText("Tooltip text")).not.toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Claim" }))
      .toHaveFocus();
  });

  it("does not pass a tap on a disabled button to its parents", async function () {
    const onParentClick = vi.fn();
    const screen = await render(
      <div onClick={onParentClick}>
        <Tooltip content="Tooltip text">
          <button disabled>Claim</button>
        </Tooltip>
      </div>,
    );

    tapCenter(screen.getByRole("button", { name: "Claim" }).element());

    await expect.element(screen.getByText("Tooltip text")).toBeVisible();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("does not open on focus that does not come from the keyboard", async function () {
    const screen = await render(
      <>
        <button>Other</button>
        <Tooltip content="Tooltip text">
          <button>Claim</button>
        </Tooltip>
      </>,
    );
    await screen.getByRole("button", { name: "Other" }).click();
    await moveMouseAway();

    (
      screen.getByRole("button", { name: "Claim" }).element() as HTMLElement
    ).focus();
    await new Promise(requestAnimationFrame);

    await expect
      .element(screen.getByRole("button", { name: "Claim" }))
      .toHaveFocus();
    expect(screen.getByText("Tooltip text").query()).toBeNull();
  });

  it("keeps a link in the tooltip clickable after the trigger takes focus", async function () {
    const onLinkClick = vi.fn();
    const screen = await render(
      <Tooltip
        content={
          <a
            href="#"
            onClick={function (event) {
              event.preventDefault();
              onLinkClick();
            }}
          >
            Explorer
          </a>
        }
      >
        <span>Info</span>
      </Tooltip>,
    );
    await screen.getByText("Info").click();

    await screen.getByRole("link", { name: "Explorer" }).click();

    expect(onLinkClick).toHaveBeenCalledOnce();
    await expect
      .element(screen.getByRole("link", { name: "Explorer" }))
      .toBeVisible();
  });

  it("does not take focus or open when visible is false", async function () {
    const screen = await render(
      <>
        <Tooltip content="Tooltip text" visible={false}>
          <span>Info</span>
        </Tooltip>
        <button>Next</button>
      </>,
    );

    await userEvent.tab();
    (screen.getByText("Info").element() as HTMLElement).click();
    await new Promise(requestAnimationFrame);

    await expect
      .element(screen.getByRole("button", { name: "Next" }))
      .toHaveFocus();
    expect(screen.getByText("Tooltip text").query()).toBeNull();
  });

  it("closes on Escape without closing the drawer around it", async function () {
    const screen = await render(
      <Drawer onClose={vi.fn()} title="Settings">
        <Tooltip content="Tooltip text">
          <button>Claim</button>
        </Tooltip>
      </Drawer>,
    );
    const drawer = screen.getByRole("dialog", { name: "Settings" });
    await waitForOpen(drawer);
    await screen.getByRole("button", { name: "Claim" }).hover();
    await expect.element(screen.getByText("Tooltip text")).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByText("Tooltip text")).not.toBeVisible();
    await new Promise(requestAnimationFrame);
    await expect.element(drawer).toHaveAttribute("data-state", "open");
  });
});
