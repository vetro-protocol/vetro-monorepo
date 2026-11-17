import { render } from "vitest-browser-react";

// Hovering pauses the auto-close timer of toasts. Without Tailwind they render
// at the top of the page, where a previous test file can leave the mouse.
export async function moveMouseAway() {
  const screen = await render(
    <div
      data-testid="corner"
      style={{ bottom: 0, height: 8, position: "fixed", right: 0, width: 8 }}
    />,
  );
  await screen.getByTestId("corner").hover();
  await screen.unmount();
}
