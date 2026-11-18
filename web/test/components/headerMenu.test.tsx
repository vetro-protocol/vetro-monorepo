import { MemoryRouter } from "react-router";
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { HeaderMenu } from "../../src/components/headerMenu";

vi.mock("../../src/components/buildInfo", () => ({ BuildInfo: () => null }));

it("identifies each language name in its own language", async function () {
  const screen = await render(
    <MemoryRouter initialEntries={["/en/contact"]}>
      <HeaderMenu />
    </MemoryRouter>,
  );
  await screen.getByRole("button", { name: "Open menu" }).click();

  const english = screen.getByRole("menuitem", { name: "English" });
  const spanish = screen.getByRole("menuitem", { name: "Español" });
  await expect
    .element(english.getByText("English"))
    .toHaveAttribute("lang", "en");
  await expect
    .element(spanish.getByText("Español"))
    .toHaveAttribute("lang", "es");
});
