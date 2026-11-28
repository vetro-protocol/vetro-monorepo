import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { Input } from "../../src/components/base/input";

describe("Input", function () {
  it("links the label to the input, and forwards typed values to onChange", async function () {
    const onChange = vi.fn();
    const screen = await render(<Input label="Email" onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Email" });

    await input.fill("alice@example.com");

    await expect.element(input).toHaveValue("alice@example.com");
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.lastCall?.[0].target.value).toBe("alice@example.com");
  });

  it("is valid and has no description when there is no error", async function () {
    const screen = await render(<Input label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });

    await expect.element(input).toBeValid();
    await expect.element(input).not.toHaveAccessibleDescription();
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error message as an alert that describes the input", async function () {
    const screen = await render(
      <Input errorMessage="Enter a valid email" label="Email" />,
    );
    const input = screen.getByRole("textbox", { name: "Email" });

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Enter a valid email");
    await expect.element(input).toBeInvalid();
    await expect
      .element(input)
      .toHaveAccessibleDescription("Enter a valid email");
  });

  it("marks the input as invalid without a message when only error is set", async function () {
    const screen = await render(<Input error label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });

    await expect.element(input).toBeInvalid();
    await expect.element(input).not.toHaveAccessibleDescription();
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps a custom aria-describedby together with the error message", async function () {
    const screen = await render(
      <>
        <p id="hint">We never share your email</p>
        <Input
          aria-describedby="hint"
          errorMessage="Enter a valid email"
          label="Email"
        />
      </>,
    );

    await expect
      .element(screen.getByRole("textbox", { name: "Email" }))
      .toHaveAccessibleDescription(
        "We never share your email Enter a valid email",
      );
  });

  it("keeps a custom aria-describedby when there is no error", async function () {
    const screen = await render(
      <>
        <p id="hint">We never share your email</p>
        <Input aria-describedby="hint" label="Email" />
      </>,
    );

    await expect
      .element(screen.getByRole("textbox", { name: "Email" }))
      .toHaveAccessibleDescription("We never share your email");
  });

  it("links the label and the error message to a custom id", async function () {
    const screen = await render(
      <Input errorMessage="Enter a valid email" id="email" label="Email" />,
    );
    const input = screen.getByRole("textbox", { name: "Email" });

    await expect.element(input).toHaveAttribute("id", "email");
    await expect
      .element(input)
      .toHaveAccessibleDescription("Enter a valid email");
  });
});
