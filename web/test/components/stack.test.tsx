import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Stack } from "../../src/components/base/stack";

import { endTransition } from "./transitions";

const autoCloseMs = 100;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Toasts() {
  const [items, setItems] = useState([
    { content: <a href="#positions">See your positions</a>, id: 1 },
  ]);

  return (
    <Stack
      autoCloseMs={autoCloseMs}
      items={items}
      onRemove={(id) =>
        setItems((current) => current.filter((i) => i.id !== id))
      }
    />
  );
}

// Without Tailwind there is no CSS transition, so the exit is finished manually
function finishExit(link: HTMLElement) {
  endTransition(link.parentElement!);
}

describe("Stack", function () {
  it("keeps the toast while focus is inside and removes it after focus leaves", async function () {
    const screen = await render(
      <>
        <button type="button">Outside</button>
        <Toasts />
      </>,
    );
    const link = screen.getByRole("link", { name: "See your positions" });

    (link.element() as HTMLElement).focus();
    await wait(autoCloseMs * 3);
    finishExit(link.element() as HTMLElement);

    await expect.element(link).toBeInTheDocument();

    (
      screen.getByRole("button", { name: "Outside" }).element() as HTMLElement
    ).focus();
    await wait(autoCloseMs * 2);
    finishExit(link.element() as HTMLElement);

    await expect.element(link).not.toBeInTheDocument();
  });

  it("removes the toast after autoCloseMs when it is not focused", async function () {
    const screen = await render(<Toasts />);
    const link = screen.getByRole("link", { name: "See your positions" });

    await wait(autoCloseMs * 2);
    finishExit(link.element() as HTMLElement);

    await expect.element(link).not.toBeInTheDocument();
  });
});
