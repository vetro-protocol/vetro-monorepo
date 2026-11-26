import { MemoryRouter, useLocation } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { LanguageRouting } from "../src/appRouting";

const CurrentLocation = function () {
  const { hash, pathname, search } = useLocation();

  return (
    <output aria-label="Current location">{`${pathname}${search}${hash}`}</output>
  );
};

afterEach(function () {
  vi.unstubAllGlobals();
});

it.each([
  { entry: "/", expected: "/en/swap" },
  { entry: "/contact", expected: "/en/contact" },
  { entry: "/borrow/0", expected: "/en/borrow/0" },
  {
    entry: "/this-page-does-not-exist?foo=bar#section",
    expected: "/en/this-page-does-not-exist?foo=bar#section",
  },
  { entry: "/fr/swap", expected: "/en/fr/swap" },
])("routes $entry to $expected", async function ({ entry, expected }) {
  vi.stubGlobal("localStorage", { getItem: () => null });
  vi.stubGlobal("navigator", { languages: ["en-US"] });

  const screen = await render(
    <MemoryRouter initialEntries={[entry]}>
      <LanguageRouting languageRoutes={<CurrentLocation />} />
    </MemoryRouter>,
  );

  await expect
    .element(screen.getByLabelText("Current location"))
    .toHaveTextContent(expected);
});
