import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ToggleButton } from "../../src/components/base/toggleButton";

describe("ToggleButton", function () {
  it("exposes a switch named by the label", async function () {
    const screen = await render(
      <ToggleButton active={false} label="Stake after swap" />,
    );

    await expect
      .element(screen.getByRole("switch", { name: "Stake after swap" }))
      .toBeInTheDocument();
  });

  it("reports the checked state from the active prop", async function () {
    const screen = await render(<ToggleButton active label="Toggle" />);
    const toggle = screen.getByRole("switch", { name: "Toggle" });

    await expect.element(toggle).toBeChecked();

    await screen.rerender(<ToggleButton active={false} label="Toggle" />);

    await expect.element(toggle).not.toBeChecked();
  });

  it("calls onClick when clicked", async function () {
    const onClick = vi.fn();
    const screen = await render(
      <ToggleButton active={false} label="Toggle" onClick={onClick} />,
    );

    await screen.getByRole("switch", { name: "Toggle" }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });
});
