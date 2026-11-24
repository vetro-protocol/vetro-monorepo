import { Link, MemoryRouter, useLocation } from "react-router";
import { expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { MainContent } from "../../src/components/base/appLayout";

function LayoutFixture() {
  const { pathname } = useLocation();

  return (
    <>
      <Link to="/es/contact">Switch to Spanish</Link>
      <Link to="/es/faq">Open FAQ</Link>
      <h1>{pathname}</h1>
      <MainContent>
        <input aria-label="Message" />
      </MainContent>
    </>
  );
}

it("preserves the page on language switches but remounts it on page navigation", async function () {
  const screen = await render(
    <MemoryRouter initialEntries={["/en/contact"]}>
      <LayoutFixture />
    </MemoryRouter>,
  );
  const message = screen.getByRole("textbox", { name: "Message" });
  await message.fill("Unsent draft");

  await screen.getByRole("link", { name: "Switch to Spanish" }).click();
  await expect
    .element(screen.getByRole("heading"))
    .toHaveTextContent("/es/contact");
  await expect.element(message).toHaveValue("Unsent draft");

  await screen.getByRole("link", { name: "Open FAQ" }).click();
  await expect
    .element(screen.getByRole("heading"))
    .toHaveTextContent("/es/faq");
  await expect.element(message).toHaveValue("");
});
