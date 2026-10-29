import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { SegmentedControl } from "../../src/components/base/segmentedControl";

const options = [
  { label: "Deposit", value: "deposit" },
  { label: "Withdraw", value: "withdraw" },
];

const ControlledSegmentedControl = function ({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState("deposit");
  return (
    <SegmentedControl
      onChange={function (newValue) {
        setValue(newValue);
        onChange(newValue);
      }}
      options={options}
      value={value}
    />
  );
};

describe("SegmentedControl", function () {
  it("selects the clicked option and calls onChange with its value", async function () {
    const onChange = vi.fn();
    const screen = await render(
      <ControlledSegmentedControl onChange={onChange} />,
    );
    const depositButton = screen.getByRole("button", { name: "Deposit" });
    const withdrawButton = screen.getByRole("button", { name: "Withdraw" });

    await expect.element(depositButton).toHaveAttribute("aria-pressed", "true");
    await expect
      .element(withdrawButton)
      .toHaveAttribute("aria-pressed", "false");

    await withdrawButton.click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith("withdraw");
    await expect
      .element(depositButton)
      .toHaveAttribute("aria-pressed", "false");
    await expect
      .element(withdrawButton)
      .toHaveAttribute("aria-pressed", "true");
  });

  it("selects the option that matches a new value from the parent", async function () {
    const screen = await render(
      <SegmentedControl onChange={vi.fn()} options={options} value="deposit" />,
    );

    await screen.rerender(
      <SegmentedControl
        onChange={vi.fn()}
        options={options}
        value="withdraw"
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Deposit" }))
      .toHaveAttribute("aria-pressed", "false");
    await expect
      .element(screen.getByRole("button", { name: "Withdraw" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("disables all options when disabled", async function () {
    const screen = await render(
      <SegmentedControl
        disabled
        onChange={vi.fn()}
        options={options}
        value="deposit"
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Deposit" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Withdraw" }))
      .toBeDisabled();
  });
});
