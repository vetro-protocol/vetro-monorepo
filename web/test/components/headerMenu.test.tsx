import { MemoryRouter, useLocation } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { HeaderMenu } from "../../src/components/headerMenu";

vi.mock("../../src/components/buildInfo", () => ({ BuildInfo: () => null }));

const languageStorageKey = "vetro:language";

afterEach(function () {
  localStorage.removeItem(languageStorageKey);
});

function LocationProbe() {
  const { hash, pathname, search } = useLocation();

  return <h1>{`${pathname}${search}${hash}`}</h1>;
}

it("identifies each language name in its own language", async function () {
  const screen = await render(
    <MemoryRouter initialEntries={["/en/contact"]}>
      <HeaderMenu />
    </MemoryRouter>,
  );
  await screen.getByRole("button", { name: "Open menu" }).click();

  const english = screen.getByRole("menuitem", { name: "English" });
  const spanish = screen.getByRole("menuitem", { name: "Español" });
  await expect.element(english).toHaveAttribute("aria-current", "page");
  await expect.element(spanish).not.toHaveAttribute("aria-current");
  await expect
    .element(english.getByText("EN", { exact: true }))
    .toHaveAttribute("aria-hidden", "true");
  await expect
    .element(spanish.getByText("ES", { exact: true }))
    .toHaveAttribute("aria-hidden", "true");
  await expect
    .element(english.getByText("English"))
    .toHaveAttribute("lang", "en");
  await expect
    .element(spanish.getByText("Español"))
    .toHaveAttribute("lang", "es");
});

it("preserves the path, query, and hash and saves the selected language", async function () {
  localStorage.setItem(languageStorageKey, "en");
  const screen = await render(
    <MemoryRouter initialEntries={["/en/contact?x=1#y"]}>
      <HeaderMenu />
      <LocationProbe />
    </MemoryRouter>,
  );
  await screen.getByRole("button", { name: "Open menu" }).click();
  await screen.getByRole("menuitem", { name: "Español" }).click();

  await expect
    .element(
      screen.getByRole("heading", { exact: true, name: "/es/contact?x=1#y" }),
    )
    .toBeInTheDocument();
  expect(localStorage.getItem(languageStorageKey)).toBe("es");
});
