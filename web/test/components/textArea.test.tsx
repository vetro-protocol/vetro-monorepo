import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { TextArea } from "../../src/components/base/textarea";

describe("TextArea", function () {
  it("links the label to the text area, and forwards typed values to onChange", async function () {
    const onChange = vi.fn();
    const screen = await render(
      <TextArea label="Message" onChange={onChange} />,
    );
    const textArea = screen.getByRole("textbox", { name: "Message" });

    await textArea.fill("First line\nSecond line");

    await expect.element(textArea).toHaveValue("First line\nSecond line");
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.lastCall?.[0].target.value).toBe(
      "First line\nSecond line",
    );
  });

  it("describes the text area with the helper text when there is no error", async function () {
    const screen = await render(
      <TextArea helperText="Max 500 characters" label="Message" />,
    );
    const textArea = screen.getByRole("textbox", { name: "Message" });

    await expect.element(textArea).toBeValid();
    await expect
      .element(textArea)
      .toHaveAccessibleDescription("Max 500 characters");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error message instead of the helper text", async function () {
    const screen = await render(
      <TextArea
        errorMessage="Message is required"
        helperText="Max 500 characters"
        label="Message"
      />,
    );
    const textArea = screen.getByRole("textbox", { name: "Message" });

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Message is required");
    await expect
      .element(screen.getByText("Max 500 characters"))
      .not.toBeInTheDocument();
    await expect.element(textArea).toBeInvalid();
    await expect
      .element(textArea)
      .toHaveAccessibleDescription("Message is required");
  });

  it("marks the text area as invalid and keeps the helper text when only error is set", async function () {
    const screen = await render(
      <TextArea error helperText="Max 500 characters" label="Message" />,
    );
    const textArea = screen.getByRole("textbox", { name: "Message" });

    await expect.element(textArea).toBeInvalid();
    await expect
      .element(textArea)
      .toHaveAccessibleDescription("Max 500 characters");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps a custom aria-describedby together with the error message", async function () {
    const screen = await render(
      <>
        <p id="hint">We reply within a day</p>
        <TextArea
          aria-describedby="hint"
          errorMessage="Message is required"
          label="Message"
        />
      </>,
    );

    await expect
      .element(screen.getByRole("textbox", { name: "Message" }))
      .toHaveAccessibleDescription("We reply within a day Message is required");
  });

  it("keeps a custom aria-describedby together with the helper text", async function () {
    const screen = await render(
      <>
        <p id="hint">We reply within a day</p>
        <TextArea
          aria-describedby="hint"
          helperText="Max 500 characters"
          label="Message"
        />
      </>,
    );

    await expect
      .element(screen.getByRole("textbox", { name: "Message" }))
      .toHaveAccessibleDescription("We reply within a day Max 500 characters");
  });

  it("links the label and the helper text to a custom id", async function () {
    const screen = await render(
      <TextArea helperText="Max 500 characters" id="message" label="Message" />,
    );
    const textArea = screen.getByRole("textbox", { name: "Message" });

    await expect.element(textArea).toHaveAttribute("id", "message");
    await expect
      .element(textArea)
      .toHaveAccessibleDescription("Max 500 characters");
  });
});
