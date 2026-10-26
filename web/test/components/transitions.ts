import { expect } from "vitest";
import type { Locator } from "vitest/browser";

export const waitForOpen = (dialog: Locator) =>
  expect.element(dialog).toHaveAttribute("data-state", "open");

export function endTransition(element: Element) {
  element.dispatchEvent(
    new TransitionEvent("transitionend", { bubbles: true }),
  );
}
