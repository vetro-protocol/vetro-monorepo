import { type ComponentProps, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { SearchInput } from "../../src/components/base/searchInput";

type Props = Partial<ComponentProps<typeof SearchInput>>;

const ControlledSearchInput = function ({ onChange, ...props }: Props) {
  const [value, setValue] = useState("");
  return (
    <SearchInput
      {...props}
      onChange={function (newValue) {
        setValue(newValue);
        onChange?.(newValue);
      }}
      value={value}
    />
  );
};

describe("SearchInput", function () {
  it("updates the value as the user types", async function () {
    const onChange = vi.fn();
    const screen = await render(<ControlledSearchInput onChange={onChange} />);

    await screen.getByRole("textbox", { name: "Search" }).click();
    await userEvent.keyboard("USDC");

    await expect
      .element(screen.getByRole("textbox", { name: "Search" }))
      .toHaveValue("USDC");
    expect(onChange).toHaveBeenLastCalledWith("USDC");
  });

  it("shows the clear button only when there is a value, and clears the value on click", async function () {
    const onChange = vi.fn();
    const screen = await render(<ControlledSearchInput onChange={onChange} />);
    const clearButton = screen.getByRole("button", { name: "Clear search" });

    await expect.element(clearButton).not.toBeInTheDocument();

    await screen.getByRole("textbox").fill("VUSD");

    await expect.element(clearButton).toBeInTheDocument();

    await clearButton.click();

    await expect.element(screen.getByRole("textbox")).toHaveValue("");
    expect(onChange).toHaveBeenLastCalledWith("");
    await expect.element(clearButton).not.toBeInTheDocument();
  });

  it("forwards key presses to onKeyDown", async function () {
    const onKeyDown = vi.fn();
    const screen = await render(
      <ControlledSearchInput onKeyDown={onKeyDown} />,
    );

    await screen.getByRole("textbox").click();
    await userEvent.keyboard("{Enter}");

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onKeyDown.mock.calls[0][0].key).toBe("Enter");
  });

  it("uses the custom aria label when one is given", async function () {
    const screen = await render(
      <ControlledSearchInput ariaLabel="Search tokens" />,
    );

    await expect
      .element(screen.getByRole("textbox", { name: "Search tokens" }))
      .toBeInTheDocument();
  });
});
