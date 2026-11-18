import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Drawer } from "../../../src/components/base/drawer";
import { SlippageSettings } from "../../../src/components/swapForm/slippageSettings";
import { endTransition, waitForOpen } from "../transitions";

type Props = {
  initialSlippage: number;
  onChange: (slippage: number) => void;
};

function Wrapper({ initialSlippage, onChange }: Props) {
  const [slippage, setSlippage] = useState(initialSlippage);
  return (
    <>
      <button type="button">Outside</button>
      <SlippageSettings
        onChange={function (next) {
          setSlippage(next);
          onChange(next);
        }}
        slippage={slippage}
      />
    </>
  );
}

async function renderSettings(initialSlippage = 0) {
  const onChange = vi.fn();
  const screen = await render(
    <Wrapper initialSlippage={initialSlippage} onChange={onChange} />,
  );
  const trigger = screen.getByRole("button", { name: "Advanced settings" });
  const input = screen.getByRole("textbox");
  const autoSwitch = screen.getByRole("switch", { name: "Auto" });

  async function openPanel() {
    await trigger.click();
    await expect.element(input).toBeInTheDocument();
  }

  async function expectPanelClosed() {
    const panel = screen
      .getByText("Advanced settings")
      .element().parentElement!;
    endTransition(panel);
    await expect.element(input).not.toBeInTheDocument();
  }

  return {
    autoSwitch,
    expectPanelClosed,
    input,
    onChange,
    openPanel,
    screen,
    trigger,
  };
}

describe("SlippageSettings", function () {
  it("shows no slippage value and an empty input in auto mode", async function () {
    const { autoSwitch, input, openPanel, screen } = await renderSettings();

    await expect.element(screen.getByText(/Slippage/)).not.toBeInTheDocument();

    await openPanel();

    await expect.element(autoSwitch).toBeChecked();
    await expect.element(input).toHaveValue("");
  });

  it("shows the current slippage on the trigger and in the input", async function () {
    const { autoSwitch, input, openPanel, screen } = await renderSettings(1.5);

    await expect.element(screen.getByText("Slippage 1.5%")).toBeVisible();

    await openPanel();

    await expect.element(autoSwitch).not.toBeChecked();
    await expect.element(input).toHaveValue("1.5");
  });

  it("marks a high slippage on the trigger", async function () {
    const { screen } = await renderSettings(7);

    await expect.element(screen.getByText("High slippage 7%")).toBeVisible();
  });

  it("calls onChange with the typed value and closes when the user presses Enter", async function () {
    const {
      autoSwitch,
      expectPanelClosed,
      input,
      onChange,
      openPanel,
      screen,
    } = await renderSettings();
    await openPanel();

    await input.fill("2.5");

    await expect.element(autoSwitch).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledExactlyOnceWith(2.5);
    await expectPanelClosed();
    await expect.element(screen.getByText("Slippage 2.5%")).toBeVisible();
  });

  it("calls onChange when the user clicks outside", async function () {
    const { expectPanelClosed, input, onChange, openPanel, screen } =
      await renderSettings();
    await openPanel();
    await input.fill("3");

    await screen.getByRole("button", { name: "Outside" }).click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(3);
    await expectPanelClosed();
  });

  it("calls onChange when the user clicks the trigger again", async function () {
    const { expectPanelClosed, input, onChange, openPanel, trigger } =
      await renderSettings();
    await openPanel();
    await input.fill("4");

    await trigger.click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(4);
    await expectPanelClosed();
  });

  it("calls onChange, closes and focuses the trigger when the user presses Escape", async function () {
    const { expectPanelClosed, input, onChange, openPanel, trigger } =
      await renderSettings();
    await openPanel();
    await input.fill("4");

    await userEvent.keyboard("{Escape}");

    expect(onChange).toHaveBeenCalledExactlyOnceWith(4);
    await expect.element(trigger).toHaveFocus();
    await expectPanelClosed();
  });

  it("closes when the user presses Escape with focus on the auto switch", async function () {
    const { autoSwitch, expectPanelClosed, onChange, openPanel, trigger } =
      await renderSettings(1.5);
    await openPanel();
    await autoSwitch.click();

    await userEvent.keyboard("{Escape}");

    expect(onChange).toHaveBeenCalledExactlyOnceWith(0);
    await expect.element(trigger).toHaveFocus();
    await expectPanelClosed();
  });

  it("does not call onChange when the value did not change", async function () {
    const { expectPanelClosed, input, onChange, openPanel } =
      await renderSettings(1.5);
    await openPanel();
    await input.fill("1.5");

    await userEvent.keyboard("{Enter}");

    await expectPanelClosed();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores input that is not a valid slippage", async function () {
    const { input, openPanel } = await renderSettings(1.5);
    await openPanel();

    await input.fill("abc");

    await expect.element(input).toHaveValue("1.5");
  });

  it("clears the value and calls onChange with the default when the user turns on auto", async function () {
    const { autoSwitch, input, onChange, openPanel, screen, trigger } =
      await renderSettings(1.5);
    await openPanel();

    await autoSwitch.click();

    await expect.element(autoSwitch).toBeChecked();
    await expect.element(input).toHaveValue("");

    await trigger.click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(0);
    await expect.element(screen.getByText(/Slippage/)).not.toBeInTheDocument();
  });

  it("focuses the input when the user turns off auto", async function () {
    const { autoSwitch, input, openPanel } = await renderSettings();
    await openPanel();

    await autoSwitch.click();

    await expect.element(autoSwitch).not.toBeChecked();
    await expect.element(input).toHaveFocus();
  });

  it("shows a warning in the panel for a high slippage", async function () {
    const { input, openPanel, screen } = await renderSettings();
    const warning = screen.getByText("High slippage", { exact: true });
    await openPanel();

    await input.fill("5");

    await expect.element(warning).not.toBeInTheDocument();

    await input.fill("6");

    await expect.element(warning).toBeVisible();
  });

  it("calls onChange with a high slippage only after the user accepts the risk", async function () {
    const { input, onChange, openPanel, screen } = await renderSettings();
    await openPanel();
    await input.fill("7");

    await userEvent.keyboard("{Enter}");

    const dialog = screen.getByRole("dialog", {
      name: "High slippage warning",
    });
    await waitForOpen(dialog);
    expect(onChange).not.toHaveBeenCalled();

    const continueButton = screen.getByRole("button", {
      name: "Continue anyway",
    });
    await expect.element(continueButton).toBeDisabled();

    await screen
      .getByRole("checkbox", { name: "I understand and accept the risk" })
      .click();
    await continueButton.click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(7);
    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(screen.getByText("High slippage 7%")).toBeVisible();
  });

  it("keeps the current slippage when the user cancels the high slippage warning", async function () {
    const { expectPanelClosed, input, onChange, openPanel, screen } =
      await renderSettings(1.5);
    await openPanel();
    await input.fill("7");
    await userEvent.keyboard("{Enter}");
    await expectPanelClosed();
    const dialog = screen.getByRole("dialog", {
      name: "High slippage warning",
    });
    await waitForOpen(dialog);

    await screen.getByRole("button", { name: "Cancel" }).click();
    endTransition(dialog.element());

    await expect.element(dialog).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await openPanel();

    await expect.element(input).toHaveValue("1.5");
  });

  describe("inside a drawer", function () {
    async function renderInDrawer() {
      const onChange = vi.fn();
      const onDrawerClose = vi.fn();
      const screen = await render(
        <>
          <button type="button">Page</button>
          <Drawer ariaLabel="Claim" onClose={onDrawerClose}>
            <Wrapper initialSlippage={0} onChange={onChange} />
          </Drawer>
        </>,
      );
      const drawer = screen.getByRole("dialog", { name: "Claim" });
      await waitForOpen(drawer);
      await screen.getByRole("button", { name: "Advanced settings" }).click();
      const input = screen.getByRole("textbox");
      await expect.element(input).toBeInTheDocument();
      return { drawer, input, onChange, onDrawerClose, screen };
    }

    it("closes only the panel when the user presses Escape", async function () {
      const { drawer, input, onChange, onDrawerClose } = await renderInDrawer();
      await input.fill("4");

      await userEvent.keyboard("{Escape}");

      expect(onChange).toHaveBeenCalledExactlyOnceWith(4);
      expect(drawer.element()).toHaveAttribute("data-state", "open");
      endTransition(drawer.element());
      expect(onDrawerClose).not.toHaveBeenCalled();
    });

    it("closes only the panel when the user clicks outside the drawer", async function () {
      const { drawer, input, onChange, onDrawerClose, screen } =
        await renderInDrawer();
      await input.fill("4");

      await screen.getByRole("button", { name: "Page" }).click();

      expect(onChange).toHaveBeenCalledExactlyOnceWith(4);
      expect(drawer.element()).toHaveAttribute("data-state", "open");
      endTransition(drawer.element());
      expect(onDrawerClose).not.toHaveBeenCalled();
    });

    it("keeps the drawer open and shows the warning when the user presses Escape with a high slippage", async function () {
      const { drawer, input, onChange, screen } = await renderInDrawer();
      await input.fill("7");

      await userEvent.keyboard("{Escape}");

      const dialog = screen.getByRole("dialog", {
        name: "High slippage warning",
      });
      await waitForOpen(dialog);
      expect(drawer.element()).toHaveAttribute("data-state", "open");
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
